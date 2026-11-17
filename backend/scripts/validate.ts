/**
 * End-to-end data and algorithm validation.
 *
 * Run with `npm run validate -w backend`. It loads the simulated dataset,
 * executes matching, all three allocators and the anomaly detector, asserts the
 * important invariants, and prints a compact report. Exits non-zero on failure.
 */
import { performance } from 'node:perf_hooks';
import { loadData } from '../src/data/loader';
import { DataStore } from '../src/data/store';
import { buildAllocationResponse, runAllocationAnalysis, runComparison, runMatchingAnalysis } from '../src/domain/analysis';
import { computePriceSeries } from '../src/domain/anomaly';
import type { ScenarioId, StrategyId } from '../../contracts/types';

const failures: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

function line(label: string, value: string | number): string {
  return `  ${label.padEnd(28)} ${value}`;
}

function main(): void {
  const started = performance.now();
  const loaded = loadData();
  const store = new DataStore(loaded);
  console.log('\nIntelligent Agricultural Supply — validation');
  console.log('==========================================');
  console.log(`  Data loaded from      ${loaded.locations.length} towns, 2 scenarios`);
  console.log(`  Constraints           max ${loaded.constraints.maxDistanceKm} km, delay ${loaded.constraints.maxDeliveryDelayDays} d, circuity ${loaded.constraints.roadCircuity}`);

  for (const scenarioId of ['A', 'B'] as ScenarioId[]) {
    const meta = store.getScenarioMeta(scenarioId);
    console.log(`\nScenario ${scenarioId}: ${meta.name}`);
    console.log(line('Farmers / Buyers', `${meta.totals.farmerCount} / ${meta.totals.buyerCount}`));
    console.log(line('Supply / Demand (kg)', `${meta.totals.totalSupplyKg} / ${meta.totals.totalDemandKg}`));

    const matching = runMatchingAnalysis(store, scenarioId, undefined);
    console.log(
      line(
        'Candidate / feasible pairs',
        `${matching.result.summary.candidatePairs} / ${matching.result.summary.feasiblePairs}`,
      ),
    );
    console.log(line('Average feasibility score', matching.result.summary.avgScore));
    check(matching.result.summary.feasiblePairs > 0, `Scenario ${scenarioId}: no feasible matches`);
    for (const match of matching.result.matches) {
      check(
        match.suitabilityScore >= 0 && match.suitabilityScore <= 100,
        `Scenario ${scenarioId}: score out of range (${match.suitabilityScore})`,
      );
      check(match.explanation.length > 0, `Scenario ${scenarioId}: missing explanation`);
    }

    // Cold allocation timing.
    const coldStart = performance.now();
    const run = runAllocationAnalysis(store, scenarioId, { strategy: 'min-cost-flow' });
    const coldMs = performance.now() - coldStart;
    const response = buildAllocationResponse(store, run, 'min-cost-flow', 'score-priority');

    console.log(line('Allocated kg', response.kpis.totalAllocatedKg));
    console.log(line('Fill rate', `${(response.kpis.fillRate * 100).toFixed(1)}%`));
    console.log(line('Unmet demand kg', response.kpis.unmetDemandKg));
    console.log(line('Average suitability', response.kpis.avgSuitability));
    console.log(line('Transport cost (Rs)', response.kpis.totalTransportCostRs));
    console.log(line("Jain's fairness index", response.kpis.jainIndex));
    console.log(line('Allocation rows', response.allocations.length));
    console.log(line('Solver', `${run.execution.result.algorithm} (${run.execution.result.augmentations} augmentations)`));
    console.log(line('Cold compute time', `${coldMs.toFixed(2)} ms`));

    check(coldMs < 100, `Scenario ${scenarioId}: allocation took ${coldMs.toFixed(1)} ms (limit 100 ms)`);
    check(
      response.kpis.totalAllocatedKg <= response.kpis.totalSupplyKg,
      `Scenario ${scenarioId}: allocated more than supply`,
    );
    check(
      response.kpis.totalAllocatedKg <= response.kpis.totalDemandKg,
      `Scenario ${scenarioId}: allocated more than demand`,
    );
    check(response.kpis.totalAllocatedKg > 0, `Scenario ${scenarioId}: nothing allocated`);

    const supplyUsed = new Map<string, number>();
    const buyerReceived = new Map<string, number>();
    for (const row of response.allocations) {
      supplyUsed.set(row.farmerId, (supplyUsed.get(row.farmerId) ?? 0) + row.quantityKg);
      buyerReceived.set(row.buyerId, (buyerReceived.get(row.buyerId) ?? 0) + row.quantityKg);
      check(row.quantityKg > 0, `Scenario ${scenarioId}: zero-kg allocation row`);
      check(row.explanation.includes('because'), `Scenario ${scenarioId}: row explanation missing reason`);
    }
    for (const farmer of matching.farmers) {
      check(
        (supplyUsed.get(farmer.id) ?? 0) <= farmer.quantityKg,
        `Scenario ${scenarioId}: farmer ${farmer.id} over-allocated`,
      );
    }
    for (const buyer of matching.buyers) {
      check(
        (buyerReceived.get(buyer.id) ?? 0) <= buyer.requiredQuantityKg,
        `Scenario ${scenarioId}: buyer ${buyer.id} received more than demand`,
      );
      const received = buyerReceived.get(buyer.id) ?? 0;
      check(
        received === 0 || received >= buyer.minAcceptableQuantityKg,
        `Scenario ${scenarioId}: buyer ${buyer.id} received a sub-lot consignment (${received} kg)`,
      );
    }

    const comparison = runComparison(store, scenarioId, {});
    console.log('  Strategies:');
    for (const metrics of comparison.comparison.results) {
      console.log(
        `    ${metrics.strategy.padEnd(16)} kg=${String(metrics.totalAllocatedKg).padStart(6)}  score=${metrics.avgSuitability
          .toFixed(2)
          .padStart(6)}  jain=${metrics.jainIndex.toFixed(4)}  transport=Rs ${metrics.totalTransportCostRs.toFixed(0)}`,
      );
    }
    const strategies = new Set(comparison.comparison.results.map((result) => result.strategy));
    for (const strategy of ['greedy', 'min-cost-flow', 'fairness'] as StrategyId[]) {
      check(strategies.has(strategy), `Scenario ${scenarioId}: missing ${strategy} strategy`);
    }
    check(comparison.comparison.tradeoffs.length > 0, `Scenario ${scenarioId}: no trade-off explanation`);
  }

  console.log('\nPrice anomaly detector');
  for (const scenarioId of ['A', 'B'] as ScenarioId[]) {
    const points = loaded.priceHistory[scenarioId].Tomato ?? [];
    const series = computePriceSeries(points, loaded.constraints.anomaly);
    const current = series.at(-1);
    console.log(
      line(
        `Scenario ${scenarioId} tomato`,
        `Rs ${current?.price}/kg, z=${current?.zScore ?? 'n/a'}, ${current?.flagged ? 'FLAGGED' : 'normal'}`,
      ),
    );
    if (scenarioId === 'B') {
      check(current?.flagged === true, 'Scenario B: tomato spike was not flagged');
    } else {
      check(current?.flagged === false, 'Scenario A: normal tomato series was flagged');
    }
  }

  const elapsed = performance.now() - started;
  console.log('\n==========================================');
  if (failures.length > 0) {
    console.log(`FAILED ${failures.length} check(s) in ${elapsed.toFixed(0)} ms:`);
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`All checks passed in ${elapsed.toFixed(0)} ms.`);
  console.log('All data is SIMULATED for demonstration purposes.\n');
}

main();
