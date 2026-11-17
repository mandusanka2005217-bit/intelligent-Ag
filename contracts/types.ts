/**
 * Shared request/response contracts for the frontend and backend.
 *
 * This file is intentionally type-only: it is imported with `import type` so it
 * can be shared across both TypeScript projects without requiring a build step.
 *
 * Vocabulary mapping (brief -> this codebase):
 *   product type      -> cropType
 *   asking price      -> pricePerKg
 *   required quantity -> requiredQuantityKg
 *   available-from    -> availableFrom
 *   minimum quantity  -> minAcceptableQuantityKg
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type Product =
  | 'Tomato'
  | 'Carrot'
  | 'Cabbage'
  | 'Beans'
  | 'Onion'
  | 'Potato'
  | 'Rice'
  | 'Maize'
  | 'Chili'
  | 'Coconut';

export type QualityGrade = 'A' | 'B' | 'C';

/** A = normal season, B = disrupted / shortage season. */
export type ScenarioId = 'A' | 'B';

export type StrategyId = 'greedy' | 'min-cost-flow' | 'fairness';

export type ShortagePolicy = 'score-priority' | 'proportional';

// ---------------------------------------------------------------------------
// Geography and configuration
// ---------------------------------------------------------------------------

export interface Town {
  name: string;
  district: string;
  province: string;
  lat: number;
  lon: number;
}

export interface WeightVector {
  price: number;
  distance: number;
  quantity: number;
  quality: number;
  availability: number;
}

export interface AnomalyConfig {
  windowDays: number;
  thresholdZ: number;
  robustWindowDays: number;
  /** Fraction of the nominal price weight kept when the price is flagged. */
  priceWeightCap: number;
}

export interface Constraints {
  maxDistanceKm: number;
  maxDeliveryDelayDays: number;
  roadCircuity: number;
  transportRatePerKgKm: number;
  /** Rs/kg value of one full 0-100 suitability point span, used in the edge cost. */
  scoreValuePerKg: number;
  qualityScores: Record<QualityGrade, number>;
  anomaly: AnomalyConfig;
}

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Farmer {
  id: string;
  name: string;
  cropType: Product;
  location: string;
  quantityKg: number;
  pricePerKg: number;
  minPricePerKg: number;
  qualityGrade: QualityGrade;
  availableFrom: string;
  createdAt: string;
  // Extended inventory tracking
  reservedKg?: number;
  completedKg?: number;
  description?: string;
}

export interface Buyer {
  id: string;
  name: string;
  requiredCropType: Product;
  location: string;
  requiredQuantityKg: number;
  maxPricePerKg: number;
  minAcceptableQuantityKg: number;
  minQualityGrade: QualityGrade;
  requiredFrom: string;
  createdAt: string;
  description?: string;
  demandStatus?: 'Active' | 'Pending' | 'Fulfilled' | 'Cancelled';
}

export interface CreateFarmerDto {
  name: string;
  location: string;
  cropType: Product;
  quantityKg: number;
  pricePerKg: number;
  /** Defaults to pricePerKg * 0.85 when omitted. */
  minPricePerKg?: number;
  /** Defaults to B when omitted. */
  qualityGrade?: QualityGrade;
  /** Defaults to today when omitted. */
  availableFrom?: string;
  description?: string;
}

export type UpdateFarmerDto = Partial<CreateFarmerDto> & {
  reservedKg?: number;
  completedKg?: number;
};

export interface CreateBuyerDto {
  name: string;
  location: string;
  requiredCropType: Product;
  requiredQuantityKg: number;
  maxPricePerKg: number;
  /** Defaults to 10% of requiredQuantityKg when omitted. */
  minAcceptableQuantityKg?: number;
  /** Defaults to C when omitted. */
  minQualityGrade?: QualityGrade;
  /** Defaults to today when omitted. */
  requiredFrom?: string;
  description?: string;
  demandStatus?: 'Active' | 'Pending' | 'Fulfilled' | 'Cancelled';
}

export type UpdateBuyerDto = Partial<CreateBuyerDto>;

// ---------------------------------------------------------------------------
// Order Management Types
// ---------------------------------------------------------------------------

export type OrderStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  cropId: string;
  cropType: Product;
  quantityKg: number;
  pricePerKg: number;
  totalAmount: number;
  deliveryLocation: string;
  orderNote?: string;
  rejectionReason?: string;
  orderStatus: OrderStatus;
  buyerContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  buyerId: string;
  buyerName: string;
  farmerId: string;
  cropId: string;
  quantityKg: number;
  deliveryLocation: string;
  orderNote?: string;
  buyerContact?: string;
}

export interface UpdateOrderStatusDto {
  orderStatus: OrderStatus;
  rejectionReason?: string;
}

export interface FarmerFilters {
  search?: string;
  cropType?: Product;
  minPricePerKg?: number;
  maxPricePerKg?: number;
  scenarioId?: ScenarioId;
}

export interface BuyerFilters {
  search?: string;
  requiredCropType?: Product;
  maxPricePerKg?: number;
  scenarioId?: ScenarioId;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export interface BlockedCorridor {
  from: string;
  to: string;
  reason: string;
}

export interface PriceSpike {
  product: Product;
  date: string;
  pct: number;
}

export interface ScenarioDisruption {
  supplyFactor: number;
  blockedCorridors: BlockedCorridor[];
  priceSpike: PriceSpike | null;
}

export interface ScenarioMeta {
  id: ScenarioId;
  name: string;
  description: string;
  simulated: true;
  disruption: ScenarioDisruption;
  totals: {
    farmerCount: number;
    buyerCount: number;
    totalSupplyKg: number;
    totalDemandKg: number;
  };
}

export interface ScenarioData {
  scenario: ScenarioMeta;
  farmers: Farmer[];
  buyers: Buyer[];
  locations: Town[];
  marketPrices: Record<string, number>;
  constraints: Constraints;
  defaultWeights: WeightVector;
  simulated: true;
}

// ---------------------------------------------------------------------------
// Matching and scoring
// ---------------------------------------------------------------------------

export interface ScoreComponents {
  price: number;
  distance: number;
  quantity: number;
  quality: number;
  availability: number;
}

export interface AnomalyInfo {
  product: Product;
  flagged: boolean;
  currentPrice: number;
  zScore: number | null;
  rollingMean: number | null;
  rollingStd: number | null;
  robustReference: number;
  warning: string | null;
}

export interface Match {
  id: string;
  scenarioId: ScenarioId;
  farmer: Farmer;
  buyer: Buyer;
  cropType: Product;
  suitabilityScore: number;
  components: ScoreComponents;
  distanceKm: number;
  transportCostPerKg: number;
  pricePerKg: number;
  marketPrice: number;
  /** 100 = best match for this buyer, 0 = weakest feasible match. */
  rankPercentile: number;
  reasons: string[];
  explanation: string;
  priceAnomaly: AnomalyInfo | null;
}

export interface MatchRequest {
  scenarioId?: ScenarioId;
  weights?: Partial<WeightVector>;
  minScore?: number;
  limit?: number;
}

export interface MatchesResponse {
  scenarioId: ScenarioId;
  simulated: true;
  generatedAt: string;
  weights: WeightVector;
  matches: Match[];
  summary: {
    candidatePairs: number;
    feasiblePairs: number;
    blockedPairs: number;
    avgScore: number;
    maxScore: number;
  };
  anomalies: AnomalyInfo[];
}

// ---------------------------------------------------------------------------
// Allocation
// ---------------------------------------------------------------------------

export interface AllocationRow {
  id: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  cropType: Product;
  quantityKg: number;
  pricePerKg: number;
  marketPrice: number;
  suitabilityScore: number;
  components: ScoreComponents;
  distanceKm: number;
  transportCostPerKg: number;
  transportCostRs: number;
  reasons: string[];
  explanation: string;
  priceAnomaly: AnomalyInfo | null;
}

export interface UnmetDemand {
  buyerId: string;
  buyerName: string;
  cropType: Product;
  location: string;
  requiredKg: number;
  allocatedKg: number;
  unmetKg: number;
  fillRatio: number;
  reasons: string[];
}

export interface FarmerSurplus {
  farmerId: string;
  farmerName: string;
  cropType: Product;
  location: string;
  availableKg: number;
  allocatedKg: number;
  surplusKg: number;
}

export interface AllocationKpis {
  totalSupplyKg: number;
  totalDemandKg: number;
  totalAllocatedKg: number;
  unmetDemandKg: number;
  fillRate: number;
  avgSuitability: number;
  totalTransportCostRs: number;
  jainIndex: number;
  fullyServedBuyers: number;
  partiallyServedBuyers: number;
  unservedBuyers: number;
  farmerCount: number;
  buyerCount: number;
  feasibleEdges: number;
  runtimeMs: number;
}

export interface AllocateRequest {
  scenarioId?: ScenarioId;
  weights?: Partial<WeightVector>;
  strategy?: StrategyId;
  shortagePolicy?: ShortagePolicy;
  constraints?: Partial<Omit<Constraints, 'qualityScores' | 'anomaly'>>;
}

export interface AllocationResponse {
  scenarioId: ScenarioId;
  simulated: true;
  generatedAt: string;
  strategy: StrategyId;
  strategyLabel: string;
  shortagePolicy: ShortagePolicy;
  weights: WeightVector;
  allocations: AllocationRow[];
  kpis: AllocationKpis;
  unmetDemand: UnmetDemand[];
  farmerSurplus: FarmerSurplus[];
  anomalies: AnomalyInfo[];
  solver: {
    algorithm: string;
    augmentations: number;
    totalEdgeCost: number;
    minLotRepairs: number;
  };
}

// ---------------------------------------------------------------------------
// Strategy comparison
// ---------------------------------------------------------------------------

export interface StrategyMetrics {
  strategy: StrategyId;
  label: string;
  description: string;
  totalAllocatedKg: number;
  fillRate: number;
  avgSuitability: number;
  totalTransportCostRs: number;
  jainIndex: number;
  minFillRate: number;
  maxFillRate: number;
  fullyServedBuyers: number;
  partiallyServedBuyers: number;
  unservedBuyers: number;
  runtimeMs: number;
}

export interface CompareRequest {
  scenarioId?: ScenarioId;
  weights?: Partial<WeightVector>;
  shortagePolicy?: ShortagePolicy;
}

export interface CompareResponse {
  scenarioId: ScenarioId;
  simulated: true;
  generatedAt: string;
  weights: WeightVector;
  shortagePolicy: ShortagePolicy;
  results: StrategyMetrics[];
  tradeoffs: string[];
}

// ---------------------------------------------------------------------------
// Prices and anomalies
// ---------------------------------------------------------------------------

export interface PricePoint {
  date: string;
  price: number;
  rollingMean: number | null;
  rollingStd: number | null;
  zScore: number | null;
  flagged: boolean;
  upper: number | null;
  lower: number | null;
}

export interface PriceAnomalyResponse {
  scenarioId: ScenarioId;
  product: Product;
  simulated: true;
  points: PricePoint[];
  current: PricePoint;
  flagged: boolean;
  warning: string | null;
  thresholdZ: number;
  windowDays: number;
  robustReference: number;
  /** Optional simple forecast; deliberately a moving average, not a model. */
  forecast?: { nextPrice: number; method: string; windowDays: number } | null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalFarmers: number;
  totalBuyers: number;
  totalMatches: number;
  avgSuitabilityScore: number;
  totalAllocatedKg: number;
  avgUtilizationPct: number;
  fillRate: number;
  totalTransportCostRs: number;
  jainIndex: number;
}

export interface ScoreDistributionBucket {
  range: string;
  count: number;
}

export interface DistancePricePoint {
  farmerId: string;
  farmerName: string;
  buyerName: string;
  distanceKm: number;
  pricePerKg: number;
  cropType: Product;
  score: number;
}

export interface AllocationBreakdownItem {
  name: string;
  value: number;
}

// ---------------------------------------------------------------------------
// CSV upload and errors
// ---------------------------------------------------------------------------

export interface CsvRowError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface CsvUploadResult {
  type: 'farmer' | 'buyer';
  inserted: number;
  errors: CsvRowError[];
  totalRows: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
    requestId?: string;
  };
}
