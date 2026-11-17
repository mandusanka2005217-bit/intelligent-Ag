import type {
  AllocationBreakdownItem,
  AnomalyInfo,
  Buyer,
  BuyerFilters,
  Constraints,
  CreateBuyerDto,
  CreateFarmerDto,
  CreateOrderDto,
  Farmer,
  FarmerFilters,
  Order,
  OrderStatus,
  PricePoint,
  Product,
  ScenarioData,
  ScenarioId,
  ScenarioMeta,
  UpdateBuyerDto,
  UpdateFarmerDto,
  UpdateOrderStatusDto,
} from '@contracts/types';
import { DEMO_TODAY } from '../config';
import { buyerSchema, farmerSchema, type LoadedData } from './loader';
import { buildAnomalyMap, computePriceSeries } from '../domain/anomaly';
import { findTown } from '../domain/geo';
import { buildScenarioData, buildScenarioMeta } from '../domain/scenarios';
import { NotFoundError, ValidationError } from '../errors';
import { round } from '../utils/math';

function nextId(prefix: 'F' | 'B', entities: Array<{ id: string }>): string {
  const max = entities.reduce((highest, entity) => {
    const numeric = Number(entity.id.replace(/\D/g, ''));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(2, '0')}`;
}

function zodDetails(error: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

function round1(value: number): number {
  return round(value, 2);
}

/**
 * In-memory mutable store.
 *
 * Scenario masters come from the validated JSON files. User additions and edits
 * are scenario-scoped and survive for the lifetime of the process only (no DB).
 * `revision` is bumped on every mutation and is part of every cache key.
 */
export class DataStore {
  readonly loaded: LoadedData;
  readonly anomalies: Record<ScenarioId, Record<string, AnomalyInfo>>;
  revision = 0;

  private farmers: Record<ScenarioId, Farmer[]>;
  private buyers: Record<ScenarioId, Buyer[]>;
  private orders: Order[] = [];

  constructor(loaded: LoadedData) {
    this.loaded = loaded;
    this.farmers = {
      A: loaded.farmers.A.map((farmer) => ({ ...farmer, reservedKg: 0, completedKg: 0 })),
      B: loaded.farmers.B.map((farmer) => ({ ...farmer, reservedKg: 0, completedKg: 0 })),
    };
    this.buyers = {
      A: loaded.buyers.A.map((buyer) => ({ ...buyer, demandStatus: 'Active' })),
      B: loaded.buyers.B.map((buyer) => ({ ...buyer, demandStatus: 'Active' })),
    };
    this.anomalies = {
      A: buildAnomalyMap(loaded.priceHistory.A, loaded.constraints.anomaly, loaded.marketPrices.A),
      B: buildAnomalyMap(loaded.priceHistory.B, loaded.constraints.anomaly, loaded.marketPrices.B),
    };
  }

  getDefaultWeights() {
    return this.loaded.defaultWeights;
  }

  getBaseConstraints(): Constraints {
    return this.loaded.constraints;
  }

  getLocations() {
    return this.loaded.locations;
  }

  mergeConstraints(overrides?: Partial<Omit<Constraints, 'qualityScores' | 'anomaly'>>): Constraints {
    if (!overrides) return this.loaded.constraints;
    const base = this.loaded.constraints;
    const merged: Constraints = {
      ...base,
      maxDistanceKm: overrides.maxDistanceKm ?? base.maxDistanceKm,
      maxDeliveryDelayDays: overrides.maxDeliveryDelayDays ?? base.maxDeliveryDelayDays,
      roadCircuity: overrides.roadCircuity ?? base.roadCircuity,
      transportRatePerKgKm: overrides.transportRatePerKgKm ?? base.transportRatePerKgKm,
      scoreValuePerKg: overrides.scoreValuePerKg ?? base.scoreValuePerKg,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) {
        throw new ValidationError(`Constraint ${key} must be a non-negative number`);
      }
    }
    return merged;
  }

  listScenarios(): ScenarioMeta[] {
    return (['A', 'B'] as ScenarioId[]).map((id) =>
      buildScenarioMeta(id, this.loaded, this.farmers[id], this.buyers[id]),
    );
  }

  getScenarioMeta(id: ScenarioId): ScenarioMeta {
    return buildScenarioMeta(id, this.loaded, this.farmers[id], this.buyers[id]);
  }

  getScenarioData(id: ScenarioId): ScenarioData {
    return buildScenarioData(id, this.loaded, this.farmers[id], this.buyers[id]);
  }

  getFarmers(id: ScenarioId): Farmer[] {
    return this.farmers[id];
  }

  getBuyers(id: ScenarioId): Buyer[] {
    return this.buyers[id];
  }

  listFarmers(id: ScenarioId, filters: FarmerFilters = {}): Farmer[] {
    const search = filters.search?.trim().toLowerCase();
    return this.farmers[id].filter((farmer) => {
      if (filters.cropType && farmer.cropType !== filters.cropType) return false;
      if (filters.minPricePerKg !== undefined && farmer.pricePerKg < filters.minPricePerKg) return false;
      if (filters.maxPricePerKg !== undefined && farmer.pricePerKg > filters.maxPricePerKg) return false;
      if (search) {
        const haystack = `${farmer.name} ${farmer.location} ${farmer.cropType}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  listBuyers(id: ScenarioId, filters: BuyerFilters = {}): Buyer[] {
    const search = filters.search?.trim().toLowerCase();
    return this.buyers[id].filter((buyer) => {
      if (filters.requiredCropType && buyer.requiredCropType !== filters.requiredCropType) return false;
      if (filters.maxPricePerKg !== undefined && buyer.maxPricePerKg > filters.maxPricePerKg) return false;
      if (search) {
        const haystack = `${buyer.name} ${buyer.location} ${buyer.requiredCropType}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  getFarmer(id: ScenarioId, farmerId: string): Farmer {
    const farmer = this.farmers[id].find((candidate) => candidate.id === farmerId);
    if (!farmer) throw new NotFoundError(`Farmer ${farmerId} not found in scenario ${id}`);
    return farmer;
  }

  getBuyer(id: ScenarioId, buyerId: string): Buyer {
    const buyer = this.buyers[id].find((candidate) => candidate.id === buyerId);
    if (!buyer) throw new NotFoundError(`Buyer ${buyerId} not found in scenario ${id}`);
    return buyer;
  }

  addFarmer(id: ScenarioId, dto: CreateFarmerDto): Farmer {
    if (!findTown(this.loaded.locations, dto.location)) {
      throw new ValidationError(`Unknown location "${dto.location}"`, [
        { path: 'location', message: `Known towns: ${this.loaded.locations.map((town) => town.name).join(', ')}` },
      ]);
    }
    const farmer: Farmer = {
      id: nextId('F', this.farmers[id]),
      name: dto.name,
      cropType: dto.cropType,
      location: dto.location,
      quantityKg: dto.quantityKg,
      pricePerKg: dto.pricePerKg,
      minPricePerKg: dto.minPricePerKg ?? round1(dto.pricePerKg * 0.85),
      qualityGrade: dto.qualityGrade ?? 'B',
      availableFrom: dto.availableFrom ?? DEMO_TODAY,
      createdAt: new Date().toISOString(),
    };
    const parsed = farmerSchema.safeParse(farmer);
    if (!parsed.success) throw new ValidationError('Invalid farmer', zodDetails(parsed.error));
    this.farmers[id].push(parsed.data as Farmer);
    this.revision += 1;
    return parsed.data as Farmer;
  }

  updateFarmer(id: ScenarioId, farmerId: string, dto: UpdateFarmerDto): Farmer {
    const existing = this.getFarmer(id, farmerId);
    if (dto.location && !findTown(this.loaded.locations, dto.location)) {
      throw new ValidationError(`Unknown location "${dto.location}"`);
    }
    const updated: Farmer = {
      ...existing,
      ...dto,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    const parsed = farmerSchema.safeParse(updated);
    if (!parsed.success) throw new ValidationError('Invalid farmer', zodDetails(parsed.error));
    this.farmers[id] = this.farmers[id].map((farmer) =>
      farmer.id === farmerId ? (parsed.data as Farmer) : farmer,
    );
    this.revision += 1;
    return parsed.data as Farmer;
  }

  deleteFarmer(id: ScenarioId, farmerId: string): void {
    const before = this.farmers[id].length;
    this.farmers[id] = this.farmers[id].filter((farmer) => farmer.id !== farmerId);
    if (this.farmers[id].length === before) throw new NotFoundError(`Farmer ${farmerId} not found`);
    this.revision += 1;
  }

  addBuyer(id: ScenarioId, dto: CreateBuyerDto): Buyer {
    if (!findTown(this.loaded.locations, dto.location)) {
      throw new ValidationError(`Unknown location "${dto.location}"`);
    }
    const buyer: Buyer = {
      id: nextId('B', this.buyers[id]),
      name: dto.name,
      requiredCropType: dto.requiredCropType,
      location: dto.location,
      requiredQuantityKg: dto.requiredQuantityKg,
      maxPricePerKg: dto.maxPricePerKg,
      minAcceptableQuantityKg:
        dto.minAcceptableQuantityKg ?? Math.max(1, Math.round(dto.requiredQuantityKg * 0.1)),
      minQualityGrade: dto.minQualityGrade ?? 'C',
      requiredFrom: dto.requiredFrom ?? DEMO_TODAY,
      createdAt: new Date().toISOString(),
    };
    const parsed = buyerSchema.safeParse(buyer);
    if (!parsed.success) throw new ValidationError('Invalid buyer', zodDetails(parsed.error));
    this.buyers[id].push(parsed.data as Buyer);
    this.revision += 1;
    return parsed.data as Buyer;
  }

  updateBuyer(id: ScenarioId, buyerId: string, dto: UpdateBuyerDto): Buyer {
    const existing = this.getBuyer(id, buyerId);
    if (dto.location && !findTown(this.loaded.locations, dto.location)) {
      throw new ValidationError(`Unknown location "${dto.location}"`);
    }
    const updated: Buyer = {
      ...existing,
      ...dto,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    const parsed = buyerSchema.safeParse(updated);
    if (!parsed.success) throw new ValidationError('Invalid buyer', zodDetails(parsed.error));
    this.buyers[id] = this.buyers[id].map((buyer) =>
      buyer.id === buyerId ? (parsed.data as Buyer) : buyer,
    );
    this.revision += 1;
    return parsed.data as Buyer;
  }

  deleteBuyer(id: ScenarioId, buyerId: string): void {
    const before = this.buyers[id].length;
    this.buyers[id] = this.buyers[id].filter((buyer) => buyer.id !== buyerId);
    if (this.buyers[id].length === before) throw new NotFoundError(`Buyer ${buyerId} not found`);
    this.revision += 1;
  }

  // ---------------------------------------------------------------------------
  // Order Management and Inventory Consistency
  // ---------------------------------------------------------------------------

  listOrders(filters?: { buyerId?: string; farmerId?: string; status?: OrderStatus }): Order[] {
    let result = [...this.orders];
    if (filters?.buyerId) {
      result = result.filter((o) => o.buyerId === filters.buyerId);
    }
    if (filters?.farmerId) {
      result = result.filter((o) => o.farmerId === filters.farmerId);
    }
    if (filters?.status) {
      result = result.filter((o) => o.orderStatus === filters.status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrder(orderId: string): Order {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new NotFoundError(`Order ${orderId} not found`);
    return order;
  }

  createOrder(dto: CreateOrderDto, scenarioId: ScenarioId = 'A'): Order {
    const farmer = this.farmers[scenarioId].find((f) => f.id === dto.cropId || f.id === dto.farmerId);
    if (!farmer) throw new NotFoundError(`Crop/Farmer ${dto.cropId} not found`);

    const reserved = farmer.reservedKg ?? 0;
    const completed = farmer.completedKg ?? 0;
    const available = Math.max(0, farmer.quantityKg - reserved - completed);

    if (dto.quantityKg <= 0) {
      throw new ValidationError('Order quantity must be greater than zero');
    }
    if (dto.quantityKg > available) {
      throw new ValidationError(`Order quantity (${dto.quantityKg}kg) exceeds available quantity (${available}kg)`);
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const totalAmount = round(dto.quantityKg * farmer.pricePerKg, 2);

    const order: Order = {
      id: orderId,
      buyerId: dto.buyerId,
      buyerName: dto.buyerName,
      farmerId: farmer.id,
      farmerName: farmer.name,
      cropId: farmer.id,
      cropType: farmer.cropType,
      quantityKg: dto.quantityKg,
      pricePerKg: farmer.pricePerKg,
      totalAmount,
      deliveryLocation: dto.deliveryLocation,
      orderNote: dto.orderNote,
      orderStatus: 'Pending',
      buyerContact: dto.buyerContact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.push(order);
    this.revision += 1;
    return order;
  }

  updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    scenarioId: ScenarioId = 'A',
  ): Order {
    const order = this.getOrder(orderId);
    const farmer = this.farmers[scenarioId].find((f) => f.id === order.farmerId || f.id === order.cropId);

    const prevStatus = order.orderStatus;
    const newStatus = dto.orderStatus;

    if (prevStatus === newStatus) return order;

    if (farmer) {
      const currentReserved = farmer.reservedKg ?? 0;
      const currentCompleted = farmer.completedKg ?? 0;

      // State transitions:
      // 1. Pending -> Accepted: Reserve quantity
      if (newStatus === 'Accepted' && prevStatus === 'Pending') {
        const available = Math.max(0, farmer.quantityKg - currentReserved - currentCompleted);
        if (order.quantityKg > available) {
          throw new ValidationError(`Cannot accept order: only ${available}kg currently available`);
        }
        farmer.reservedKg = currentReserved + order.quantityKg;
      }

      // 2. Accepted -> Rejected or Cancelled: Release reserved quantity
      if ((newStatus === 'Rejected' || newStatus === 'Cancelled') && prevStatus === 'Accepted') {
        farmer.reservedKg = Math.max(0, currentReserved - order.quantityKg);
      }

      // 3. Accepted -> Completed: Move reserved to completed sales
      if (newStatus === 'Completed' && prevStatus === 'Accepted') {
        farmer.reservedKg = Math.max(0, currentReserved - order.quantityKg);
        farmer.completedKg = currentCompleted + order.quantityKg;
      }

      // 4. Pending -> Completed: Direct completion
      if (newStatus === 'Completed' && prevStatus === 'Pending') {
        farmer.completedKg = currentCompleted + order.quantityKg;
      }
    }

    order.orderStatus = newStatus;
    if (dto.rejectionReason) {
      order.rejectionReason = dto.rejectionReason;
    }
    order.updatedAt = new Date().toISOString();

    this.revision += 1;
    return order;
  }

  getAnomalies(id: ScenarioId): Record<string, AnomalyInfo> {
    return this.anomalies[id];
  }

  getPriceSeries(id: ScenarioId, product: Product): PricePoint[] {
    const points = this.loaded.priceHistory[id][product];
    if (!points) throw new NotFoundError(`No price history for ${product} in scenario ${id}`);
    return computePriceSeries(points, this.loaded.constraints.anomaly);
  }

  getRawPriceHistory(id: ScenarioId, product: Product) {
    const points = this.loaded.priceHistory[id][product];
    if (!points) throw new NotFoundError(`No price history for ${product} in scenario ${id}`);
    return points;
  }

  /** Dashboard pie helper: allocated kg by product. */
  allocationBreakdown(rows: Array<{ cropType: string; quantityKg: number }>): AllocationBreakdownItem[] {
    const byProduct = new Map<string, number>();
    for (const row of rows) {
      byProduct.set(row.cropType, (byProduct.get(row.cropType) ?? 0) + row.quantityKg);
    }
    return [...byProduct.entries()]
      .map(([name, value]) => ({ name, value: round(value, 2) }))
      .sort((a, b) => b.value - a.value);
  }
}

let singleton: DataStore | null = null;

export function setStore(store: DataStore): void {
  singleton = store;
}

export function getStore(): DataStore {
  if (!singleton) throw new Error('Data store has not been initialised');
  return singleton;
}
