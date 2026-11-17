import { z } from 'zod';
import { PRODUCTS, QUALITY_GRADES, SCENARIO_IDS, STRATEGIES } from '../domain/constants';

export const scenarioIdSchema = z.enum(SCENARIO_IDS);
export const scenarioQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
});
export const scenarioParamSchema = z.object({ id: scenarioIdSchema });

export const qualityGradeSchema = z.enum(QUALITY_GRADES);
export const productSchema = z.enum(PRODUCTS);
export const strategySchema = z.enum(STRATEGIES);
export const shortagePolicySchema = z.enum(['score-priority', 'proportional']);

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), 'Invalid date');

export const weightsSchema = z
  .object({
    price: z.number().min(0).max(1),
    distance: z.number().min(0).max(1),
    quantity: z.number().min(0).max(1),
    quality: z.number().min(0).max(1),
    availability: z.number().min(0).max(1),
  })
  .partial()
  .refine(
    (weights) =>
      Object.values(weights).every((value) => value === undefined || Number.isFinite(value)),
    'Weights must be finite',
  );

export const constraintsOverrideSchema = z.object({
  maxDistanceKm: z.number().positive().max(2000).optional(),
  maxDeliveryDelayDays: z.number().nonnegative().max(60).optional(),
  roadCircuity: z.number().min(1).max(3).optional(),
  transportRatePerKgKm: z.number().nonnegative().max(10).optional(),
  scoreValuePerKg: z.number().positive().max(1000).optional(),
});

export const farmerCreateSchema = z
  .object({
    scenarioId: scenarioIdSchema.optional(),
    name: z.string().min(2).max(120),
    location: z.string().min(1).max(80),
    cropType: productSchema,
    quantityKg: z.number().int().positive().max(1_000_000),
    pricePerKg: z.number().positive().max(100_000),
    minPricePerKg: z.number().positive().max(100_000).optional(),
    qualityGrade: qualityGradeSchema.optional(),
    availableFrom: isoDateSchema.optional(),
  })
  .superRefine((farmer, ctx) => {
    if (farmer.minPricePerKg !== undefined && farmer.minPricePerKg > farmer.pricePerKg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minPricePerKg'],
        message: 'minPricePerKg cannot exceed pricePerKg',
      });
    }
  });

export const farmerUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  location: z.string().min(1).max(80).optional(),
  cropType: productSchema.optional(),
  quantityKg: z.number().int().positive().max(1_000_000).optional(),
  pricePerKg: z.number().positive().max(100_000).optional(),
  minPricePerKg: z.number().positive().max(100_000).optional(),
  qualityGrade: qualityGradeSchema.optional(),
  availableFrom: isoDateSchema.optional(),
});

export const buyerCreateSchema = z
  .object({
    scenarioId: scenarioIdSchema.optional(),
    name: z.string().min(2).max(120),
    location: z.string().min(1).max(80),
    requiredCropType: productSchema,
    requiredQuantityKg: z.number().int().positive().max(1_000_000),
    maxPricePerKg: z.number().positive().max(100_000),
    minAcceptableQuantityKg: z.number().int().positive().max(1_000_000).optional(),
    minQualityGrade: qualityGradeSchema.optional(),
    requiredFrom: isoDateSchema.optional(),
  })
  .superRefine((buyer, ctx) => {
    if (
      buyer.minAcceptableQuantityKg !== undefined &&
      buyer.minAcceptableQuantityKg > buyer.requiredQuantityKg
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minAcceptableQuantityKg'],
        message: 'Minimum lot cannot exceed the required quantity',
      });
    }
  });

export const buyerUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  location: z.string().min(1).max(80).optional(),
  requiredCropType: productSchema.optional(),
  requiredQuantityKg: z.number().int().positive().max(1_000_000).optional(),
  maxPricePerKg: z.number().positive().max(100_000).optional(),
  minAcceptableQuantityKg: z.number().int().positive().max(1_000_000).optional(),
  minQualityGrade: qualityGradeSchema.optional(),
  requiredFrom: isoDateSchema.optional(),
});

export const matchBodySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  weights: weightsSchema.optional(),
  minScore: z.number().min(0).max(100).optional(),
  limit: z.number().int().positive().max(500).optional(),
});

export const allocateBodySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  weights: weightsSchema.optional(),
  strategy: strategySchema.optional(),
  shortagePolicy: shortagePolicySchema.optional(),
  constraints: constraintsOverrideSchema.optional(),
});

export const compareBodySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  weights: weightsSchema.optional(),
  shortagePolicy: shortagePolicySchema.optional(),
});

export const farmerQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  search: z.string().max(120).optional(),
  cropType: productSchema.optional(),
  minPricePerKg: z.coerce.number().nonnegative().optional(),
  maxPricePerKg: z.coerce.number().nonnegative().optional(),
});

export const matchQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const allocationQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  strategy: strategySchema.optional(),
  shortagePolicy: shortagePolicySchema.optional(),
});

export const dashboardQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
});

export const priceQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
});

export const productParamSchema = z.object({
  product: z.string().min(1).max(40),
});

export const buyerQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  search: z.string().max(120).optional(),
  requiredCropType: productSchema.optional(),
  maxPricePerKg: z.coerce.number().nonnegative().optional(),
});
