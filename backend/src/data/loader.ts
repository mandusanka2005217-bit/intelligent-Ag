import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type {
  BlockedCorridor,
  Buyer,
  Constraints,
  Farmer,
  Product,
  ScenarioId,
  ScenarioMeta,
  Town,
  WeightVector,
} from '@contracts/types';
import { CONFIG_DIR, DATA_DIR } from '../config';
import { PRODUCTS, QUALITY_GRADES, SCENARIO_IDS } from '../domain/constants';
import { csvToRecords } from '../utils/csv';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), 'Invalid date');

const townSchema = z.object({
  name: z.string().min(1),
  district: z.string().min(1),
  province: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const farmerSchema = z
  .object({
    id: z.string().regex(/^F\d{2,}$/, 'Farmer id must look like F01'),
    name: z.string().min(2),
    cropType: z.enum(PRODUCTS),
    location: z.string().min(1),
    quantityKg: z.number().int().min(0).max(1_000_000),
    pricePerKg: z.number().positive().max(100_000),
    minPricePerKg: z.number().positive().max(100_000),
    qualityGrade: z.enum(QUALITY_GRADES),
    availableFrom: isoDate,
    createdAt: z.string().min(1),
  })
  .superRefine((farmer, ctx) => {
    if (farmer.minPricePerKg > farmer.pricePerKg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minPricePerKg'],
        message: 'minPricePerKg cannot exceed the asking price',
      });
    }
  });

export const buyerSchema = z.object({
  id: z.string().regex(/^B\d{2,}$/, 'Buyer id must look like B01'),
  name: z.string().min(2),
  requiredCropType: z.enum(PRODUCTS),
  location: z.string().min(1),
  requiredQuantityKg: z.number().int().positive().max(1_000_000),
  maxPricePerKg: z.number().positive().max(100_000),
  minAcceptableQuantityKg: z.number().int().positive().max(1_000_000),
  minQualityGrade: z.enum(QUALITY_GRADES),
  requiredFrom: isoDate,
  createdAt: z.string().min(1),
});

const blockedCorridorSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  reason: z.string().min(1),
});

const scenarioDescriptorSchema = z.object({
  id: z.enum(SCENARIO_IDS),
  name: z.string().min(1),
  description: z.string().min(1),
  disruption: z.object({
    supplyFactor: z.number().positive().max(1),
    blockedCorridors: z.array(blockedCorridorSchema),
    priceSpike: z
      .object({
        product: z.enum(PRODUCTS),
        date: isoDate,
        pct: z.number(),
      })
      .nullable(),
  }),
});

const weightsSchema = z
  .object({
    price: z.number().min(0).max(1),
    distance: z.number().min(0).max(1),
    quantity: z.number().min(0).max(1),
    quality: z.number().min(0).max(1),
    availability: z.number().min(0).max(1),
  })
  .refine(
    (weights) =>
      weights.price + weights.distance + weights.quantity + weights.quality + weights.availability >
      0,
    'At least one weight must be positive',
  );

const constraintsSchema = z.object({
  maxDistanceKm: z.number().positive().max(2000),
  maxDeliveryDelayDays: z.number().nonnegative().max(60),
  roadCircuity: z.number().min(1).max(3),
  transportRatePerKgKm: z.number().nonnegative().max(10),
  scoreValuePerKg: z.number().positive().max(1000),
  qualityScores: z.object({
    A: z.number().min(0).max(100),
    B: z.number().min(0).max(100),
    C: z.number().min(0).max(100),
  }),
  anomaly: z.object({
    windowDays: z.number().int().min(3).max(90),
    thresholdZ: z.number().positive().max(10),
    robustWindowDays: z.number().int().min(3).max(365),
    priceWeightCap: z.number().min(0).max(1),
  }),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawPricePoint {
  date: string;
  market: string;
  product: Product;
  price: number;
}

export interface LoadedData {
  locations: Town[];
  descriptors: Record<ScenarioId, z.infer<typeof scenarioDescriptorSchema>>;
  farmers: Record<ScenarioId, Farmer[]>;
  buyers: Record<ScenarioId, Buyer[]>;
  marketPrices: Record<ScenarioId, Record<string, number>>;
  priceHistory: Record<ScenarioId, Record<string, RawPricePoint[]>>;
  constraints: Constraints;
  defaultWeights: WeightVector;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson(file: string): unknown {
  if (!fs.existsSync(file)) throw new Error(`Missing required data file: ${file}`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}: ${(error as Error).message}`);
  }
}

function formatIssues(file: string, error: z.ZodError): string {
  return `${file}:\n${error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')}`;
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(formatIssues(file, result.error));
  return result.data;
}

function assertUnique(ids: string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
}

function validateReferences(
  farmers: Farmer[],
  buyers: Buyer[],
  towns: Town[],
  marketPrices: Record<string, number>,
  scenarioId: ScenarioId,
): void {
  const townNames = new Set(towns.map((town) => town.name.toLowerCase()));
  for (const farmer of farmers) {
    if (!townNames.has(farmer.location.toLowerCase())) {
      throw new Error(`Scenario ${scenarioId}: farmer ${farmer.id} references unknown town "${farmer.location}"`);
    }
  }
  for (const buyer of buyers) {
    if (!townNames.has(buyer.location.toLowerCase())) {
      throw new Error(`Scenario ${scenarioId}: buyer ${buyer.id} references unknown town "${buyer.location}"`);
    }
  }
  const requiredProducts = new Set<string>([
    ...farmers.map((farmer) => farmer.cropType),
    ...buyers.map((buyer) => buyer.requiredCropType),
  ]);
  for (const product of requiredProducts) {
    if (marketPrices[product] === undefined) {
      throw new Error(`Scenario ${scenarioId}: missing market price for "${product}"`);
    }
  }
}

function loadPriceHistory(dataDir: string, scenarioId: ScenarioId): Record<string, RawPricePoint[]> {
  const dir = path.join(dataDir, 'price_history', `scenario_${scenarioId.toLowerCase()}`);
  const result: Record<string, RawPricePoint[]> = {};
  if (!fs.existsSync(dir)) return result;

  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.csv'));
  for (const file of files) {
    const records = csvToRecords(fs.readFileSync(path.join(dir, file), 'utf8'));
    const points: RawPricePoint[] = [];
    for (const [index, record] of records.entries()) {
      const date = record.date;
      const product = record.product as Product;
      const price = Number(record.price_lkr_per_kg);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
        throw new Error(`Price history ${file} row ${index + 2}: invalid date "${date}"`);
      }
      if (!PRODUCTS.includes(product)) {
        throw new Error(`Price history ${file} row ${index + 2}: unknown product "${product}"`);
      }
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`Price history ${file} row ${index + 2}: invalid price "${record.price_lkr_per_kg}"`);
      }
      points.push({ date, market: record.market || 'Unknown', product, price });
    }

    points.sort((a, b) => a.date.localeCompare(b.date));
    const uniqueDates = new Set(points.map((point) => point.date));
    if (uniqueDates.size !== points.length) {
      throw new Error(`Price history ${file}: duplicate dates`);
    }
    if (points.length > 0) {
      const product = points[0].product;
      if (result[product]) throw new Error(`Price history for ${product} appears twice in scenario ${scenarioId}`);
      result[product] = points;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public loader
// ---------------------------------------------------------------------------

/**
 * Load, parse, validate and clean all simulated data at startup.
 * Throws an aggregated, readable error instead of starting with partial data.
 */
export function loadData(dataDir = DATA_DIR): LoadedData {
  const locationsFile = path.join(dataDir, 'locations.json');
  const locations = parseOrThrow(z.array(townSchema), readJson(locationsFile), locationsFile);
  assertUnique(
    locations.map((town) => town.name.toLowerCase()),
    'town',
  );
  const towns = locations as Town[];

  const descriptorsFile = path.join(dataDir, 'scenarios.json');
  const descriptorList = parseOrThrow(
    z.array(scenarioDescriptorSchema),
    readJson(descriptorsFile),
    descriptorsFile,
  );
  assertUnique(
    descriptorList.map((d) => d.id),
    'scenario',
  );
  if (descriptorList.length !== 2) {
    throw new Error('Exactly two scenarios (A and B) are required');
  }
  const descriptors = Object.fromEntries(descriptorList.map((d) => [d.id, d])) as Record<
    ScenarioId,
    (typeof descriptorList)[number]
  >;

  const farmers: Record<ScenarioId, Farmer[]> = { A: [], B: [] };
  const buyers: Record<ScenarioId, Buyer[]> = { A: [], B: [] };
  const marketPrices: Record<ScenarioId, Record<string, number>> = { A: {}, B: {} };
  const priceHistory: Record<ScenarioId, Record<string, RawPricePoint[]>> = { A: {}, B: {} };

  for (const scenarioId of SCENARIO_IDS) {
    const dir = path.join(dataDir, `scenario_${scenarioId.toLowerCase()}`);
    const farmersFile = path.join(dir, 'farmers.json');
    const buyersFile = path.join(dir, 'buyers.json');
    const pricesFile = path.join(dir, 'market_prices.json');

    const scenarioFarmers = parseOrThrow(z.array(farmerSchema), readJson(farmersFile), farmersFile) as Farmer[];
    const scenarioBuyers = parseOrThrow(z.array(buyerSchema), readJson(buyersFile), buyersFile) as Buyer[];
    const prices = parseOrThrow(
      z.record(z.number().positive()),
      readJson(pricesFile),
      pricesFile,
    );

    assertUnique(
      scenarioFarmers.map((farmer) => farmer.id),
      `scenario ${scenarioId} farmer`,
    );
    assertUnique(
      scenarioBuyers.map((buyer) => buyer.id),
      `scenario ${scenarioId} buyer`,
    );
    validateReferences(scenarioFarmers, scenarioBuyers, towns, prices, scenarioId);

    farmers[scenarioId] = scenarioFarmers;
    buyers[scenarioId] = scenarioBuyers;
    marketPrices[scenarioId] = prices;
    priceHistory[scenarioId] = loadPriceHistory(dataDir, scenarioId);
  }

  const weightsFile = path.join(CONFIG_DIR, 'weights.json');
  const constraintsFile = path.join(CONFIG_DIR, 'constraints.json');
  const defaultWeights = parseOrThrow(weightsSchema, readJson(weightsFile), weightsFile) as WeightVector;
  const constraints = parseOrThrow(constraintsSchema, readJson(constraintsFile), constraintsFile) as Constraints;

  return {
    locations: towns,
    descriptors,
    farmers,
    buyers,
    marketPrices,
    priceHistory,
    constraints,
    defaultWeights,
  };
}

export function scenarioMetaFrom(
  descriptor: z.infer<typeof scenarioDescriptorSchema>,
  farmers: Farmer[],
  buyers: Buyer[],
): ScenarioMeta {
  return {
    id: descriptor.id,
    name: descriptor.name,
    description: descriptor.description,
    simulated: true,
    disruption: descriptor.disruption as {
      supplyFactor: number;
      blockedCorridors: BlockedCorridor[];
      priceSpike: { product: Product; date: string; pct: number } | null;
    },
    totals: {
      farmerCount: farmers.length,
      buyerCount: buyers.length,
      totalSupplyKg: farmers.reduce((total, farmer) => total + farmer.quantityKg, 0),
      totalDemandKg: buyers.reduce((total, buyer) => total + buyer.requiredQuantityKg, 0),
    },
  };
}
