import type {
  Buyer,
  Farmer,
  PriceRecommendation,
  PriceRecommendationResponse,
  Product,
  ScenarioId,
} from '@contracts/types';
import { PRODUCTS } from '../domain/constants';
import { round } from '../utils/math';

/**
 * Intelligent Price Recommendation Engine
 * Recommends fair pricing corridors (Grade A/B/C) based on historical market prices,
 * current farmer asking prices, buyer budgets, transport friction, and supply-demand tension.
 */
export function generatePriceRecommendations(
  scenarioId: ScenarioId,
  farmers: Farmer[],
  buyers: Buyer[],
  marketPrices: Record<string, number>,
): PriceRecommendationResponse {
  const recommendations: PriceRecommendation[] = PRODUCTS.map((product) => {
    const baseMarketPrice = marketPrices[product] ?? 180;
    const farmerOffers = farmers.filter((f) => f.cropType === product);
    const buyerBids = buyers.filter((b) => b.requiredCropType === product);

    const minRecorded = farmerOffers.length > 0 ? Math.min(...farmerOffers.map((f) => f.pricePerKg)) : round(baseMarketPrice * 0.85, 1);
    const maxRecorded = farmerOffers.length > 0 ? Math.max(...farmerOffers.map((f) => f.pricePerKg)) : round(baseMarketPrice * 1.15, 1);

    const buyerMaxAvg = buyerBids.length > 0
      ? round(buyerBids.reduce((s, b) => s + b.maxPricePerKg, 0) / buyerBids.length, 1)
      : round(baseMarketPrice * 1.1, 1);

    // Scenario tension multiplier
    const tension = scenarioId === 'B' ? 1.15 : 1.0;
    const baseP = baseMarketPrice * tension;

    const gradeA = round(baseP * 1.08, 1);
    const gradeB = round(baseP * 0.98, 1);
    const gradeC = round(baseP * 0.88, 1);

    const fairMin = round(baseP * 0.9, 1);
    const fairMax = round(Math.min(buyerMaxAvg, baseP * 1.15), 1);

    const estimatedTransportCostPerKg = round(1.85, 2);
    const estimatedFarmerNetProceeds = round(gradeB - estimatedTransportCostPerKg, 2);

    const rationale = scenarioId === 'B'
      ? `High market tension for ${product}. Shortage premium applied (+15%). Recommended selling point is close to wholesale ceiling.`
      : `Stable supply conditions for ${product}. Fair clearing range is Rs. ${fairMin}–${fairMax}/kg.`;

    return {
      cropType: product,
      marketPrice: round(baseMarketPrice, 1),
      minRecordedPrice: minRecorded,
      maxRecordedPrice: maxRecorded,
      recommendedSellingPrice: {
        gradeA,
        gradeB,
        gradeC,
      },
      buyerMaxAverage: buyerMaxAvg,
      fairPriceRange: { min: fairMin, max: fairMax },
      estimatedTransportCostPerKg,
      estimatedFarmerNetProceeds,
      rationale,
    };
  });

  return {
    scenarioId,
    recommendations,
  };
}
