import type {
  Farmer,
  FreshnessIntelligenceResponse,
  FreshnessItem,
  Product,
  ScenarioId,
  SpoilageRisk,
} from '@contracts/types';
import { round } from '../utils/math';

/**
 * Standard Sri Lankan agricultural crop perishability baselines (ambient shelf-life in days).
 */
export const CROP_SHELF_LIFE_DAYS: Record<Product, number> = {
  Tomato: 7,
  Beans: 8,
  Cabbage: 14,
  Carrot: 21,
  Potato: 45,
  Onion: 40,
  Chili: 10,
  Maize: 14,
  Rice: 180,
  Coconut: 90,
};

/**
 * Perishable Product Intelligence
 * Evaluates crop harvest age, remaining shelf-life, assigns Freshness Priority Score (0-100),
 * determines Spoilage Risk, and ranks products by First-Expire-First-Out (FEFO).
 */
export function evaluateFreshnessIntelligence(
  scenarioId: ScenarioId,
  farmers: Farmer[],
  referenceDateStr: string = '2026-11-15',
): FreshnessIntelligenceResponse {
  const refDate = new Date(`${referenceDateStr}T00:00:00Z`).getTime();

  const items: FreshnessItem[] = farmers.map((farmer) => {
    const harvestDateStr = farmer.availableFrom || referenceDateStr;
    const harvestDate = new Date(`${harvestDateStr}T00:00:00Z`).getTime();

    // Age in days since harvest
    const diffDays = Math.max(0, Math.floor((refDate - harvestDate) / (1000 * 60 * 60 * 24)));
    const shelfLife = CROP_SHELF_LIFE_DAYS[farmer.cropType] ?? 14;
    const remainingDays = Math.max(0, shelfLife - diffDays);

    // Freshness score: 100 = just harvested, 0 = at or past shelf life
    let freshnessScore = Math.max(0, Math.min(100, Math.round((remainingDays / shelfLife) * 100)));

    // Quality grade adjustment
    if (farmer.qualityGrade === 'A') freshnessScore = Math.min(100, freshnessScore + 5);
    if (farmer.qualityGrade === 'C') freshnessScore = Math.max(0, freshnessScore - 10);

    // Spoilage risk category
    let spoilageRisk: SpoilageRisk = 'Low';
    let warning: string | null = null;

    if (remainingDays <= 2) {
      spoilageRisk = 'Critical';
      warning = `Immediate dispatch required: ${remainingDays} days remaining before spoilage!`;
    } else if (remainingDays <= 4) {
      spoilageRisk = 'High';
      warning = `Near-expiry produce: prioritize matching within 24 hours.`;
    } else if (remainingDays <= 7) {
      spoilageRisk = 'Medium';
    }

    return {
      cropId: farmer.id,
      farmerName: farmer.name,
      cropType: farmer.cropType,
      location: farmer.location,
      harvestDate: harvestDateStr,
      harvestAgeDays: diffDays,
      shelfLifeDays: shelfLife,
      remainingShelfLifeDays: remainingDays,
      freshnessScore,
      spoilageRisk,
      fefoRank: 0,
      warning,
    };
  });

  // Sort by FEFO (First-Expire-First-Out: least remaining days first)
  items.sort((a, b) => a.remainingShelfLifeDays - b.remainingShelfLifeDays);
  items.forEach((item, index) => {
    item.fefoRank = index + 1;
  });

  const highRiskCount = items.filter((i) => i.spoilageRisk === 'High' || i.spoilageRisk === 'Critical').length;
  const nearExpiryCount = items.filter((i) => i.remainingShelfLifeDays <= 3).length;
  const avgFreshnessScore = items.length > 0 ? round(items.reduce((s, i) => s + i.freshnessScore, 0) / items.length, 1) : 85;

  return {
    scenarioId,
    items,
    highRiskCount,
    nearExpiryCount,
    avgFreshnessScore,
  };
}
