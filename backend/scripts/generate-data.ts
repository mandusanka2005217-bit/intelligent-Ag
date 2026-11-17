/**
 * Deterministic data generator.
 *
 * Produces:
 *  - data/scenario_b/* from scenario_a (40% supply cut, F07 washed out)
 *  - data/scenario_b/market_prices.json (tomato spike)
 *  - data/price_history/{A,B}/{product}.csv (90 days, seeded)
 *
 * Everything is SIMULATED. Re-running the script must produce byte-identical
 * files, which is why a seeded PRNG is used instead of Math.random().
 *
 * Usage: npm run generate:data (from the repository root)
 */
import fs from 'node:fs';
import path from 'node:path';

const DEMO_TODAY = '2026-11-15';
const HISTORY_DAYS = 90;
const SEED = 42;
const SUPPLY_FACTOR = 0.6;
const WASHED_OUT_FARMER = 'F07';
const SPIKE_PRODUCT = 'Tomato';
const SPIKE_PCT = 0.45;
const SPIKE_DATES = new Set(['2026-11-15']);

const PRODUCT_VOLATILITY: Record<string, number> = {
  Tomato: 6,
  Carrot: 5,
  Cabbage: 4,
  Beans: 9,
  Onion: 6,
  Potato: 4,
};

interface FarmerFile {
  id: string;
  quantityKg: number;
  [key: string]: unknown;
}

interface Meta {
  id: string;
  marketPrices: Record<string, number>;
}

function findRepoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..')];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'data', 'locations.json'))) return candidate;
  }
  throw new Error('Could not locate the repository root (data/locations.json not found)');
}

/** mulberry32: tiny, fast, deterministic 32-bit PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform on a seeded PRNG. */
function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function isoDay(offsetFromToday: number): string {
  const d = new Date(`${DEMO_TODAY}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offsetFromToday);
  return d.toISOString().slice(0, 10);
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function main(): void {
  const root = findRepoRoot();
  const dataDir = path.join(root, 'data');
  const scenarioA = path.join(dataDir, 'scenario_a');

  const farmers = JSON.parse(fs.readFileSync(path.join(scenarioA, 'farmers.json'), 'utf8')) as FarmerFile[];
  const buyers = JSON.parse(fs.readFileSync(path.join(scenarioA, 'buyers.json'), 'utf8')) as unknown[];
  const pricesA = JSON.parse(fs.readFileSync(path.join(scenarioA, 'market_prices.json'), 'utf8')) as Record<string, number>;

  // --- Scenario B: deterministic disruption -------------------------------
  const scenarioB = path.join(dataDir, 'scenario_b');
  const farmersB = farmers.map((farmer) => {
    const quantityKg =
      farmer.id === WASHED_OUT_FARMER ? 0 : Math.round(farmer.quantityKg * SUPPLY_FACTOR);
    return { ...farmer, quantityKg };
  });
  writeJson(path.join(scenarioB, 'farmers.json'), farmersB);
  writeJson(path.join(scenarioB, 'buyers.json'), buyers);

  const pricesB: Record<string, number> = { ...pricesA };
  if (pricesB[SPIKE_PRODUCT] !== undefined) {
    pricesB[SPIKE_PRODUCT] = Math.round(pricesB[SPIKE_PRODUCT] * (1 + SPIKE_PCT));
  }
  writeJson(path.join(scenarioB, 'market_prices.json'), pricesB);

  // --- Price history -------------------------------------------------------
  const scenarios: Meta[] = [
    { id: 'A', marketPrices: pricesA },
    { id: 'B', marketPrices: pricesB },
  ];

  for (const scenario of scenarios) {
    const outDir = path.join(dataDir, 'price_history', `scenario_${scenario.id.toLowerCase()}`);
    fs.mkdirSync(outDir, { recursive: true });

    for (const [product, basePrice] of Object.entries(scenario.marketPrices)) {
      // Seed by product only, so unaffected products have identical history in
      // both scenarios. The disruption changes prices for the spiked product,
      // not the noise on every other series.
      const rand = mulberry32(SEED + product.length * 101);
      const vol = PRODUCT_VOLATILITY[product] ?? Math.max(2, basePrice * 0.05);
      const rows: string[] = ['date,market,product,price_lkr_per_kg'];

      // Always generate the "normal" baseline from scenario A, then inject the
      // disruption. Otherwise scenario B's already-spiked market price would be
      // used as the baseline and the spike would be applied twice.
      const baseline = pricesA[product] ?? basePrice;

      const raw: number[] = [];
      let level = 0;
      for (let i = 0; i < HISTORY_DAYS; i += 1) {
        const seasonal = 1 + 0.02 * Math.sin((2 * Math.PI * i) / 90);
        // Mean-reverting noise: prices wander around the baseline but do not
        // drift away from it. This keeps the simulated series believable and
        // stops the final observation from being a one-off jump.
        level = 0.3 * level + gaussian(rand) * vol * 0.45;
        raw.push(baseline * seasonal + level + gaussian(rand) * 1.5);
      }

      // Today's quote is exactly the scenario's market price; the preceding
      // days are mean-reverting simulations around it.
      raw[HISTORY_DAYS - 1] = baseline;

      for (let i = 0; i < HISTORY_DAYS; i += 1) {
        const date = isoDay(i - (HISTORY_DAYS - 1));
        let price = raw[i];

        // The disruption is an abrupt, explicit spike, applied after anchoring.
        if (
          scenario.id === 'B' &&
          product === SPIKE_PRODUCT &&
          SPIKE_DATES.has(date)
        ) {
          price = baseline * (1 + SPIKE_PCT);
        }

        rows.push(`${date},Dambulla Wholesale,${product},${Math.max(1, Math.round(price)).toFixed(2)}`);
      }

      fs.writeFileSync(path.join(outDir, `${product.toLowerCase()}.csv`), `${rows.join('\n')}\n`, 'utf8');
    }
  }

  fs.writeFileSync(
    path.join(dataDir, 'price_history', 'README.md'),
    [
      '# SIMULATED price history',
      '',
      `Generated by \`backend/scripts/generate-data.ts\` with seed ${SEED}, ${HISTORY_DAYS} days ending ${DEMO_TODAY}.`,
      'One CSV per product per scenario. Scenario B injects a +45% tomato spike on 2026-11-14 and 2026-11-15.',
      'Do not treat these numbers as real market data.',
      '',
    ].join('\n'),
    'utf8',
  );

  const totalA = farmers.reduce((sum, f) => sum + f.quantityKg, 0);
  const totalB = farmersB.reduce((sum, f) => sum + f.quantityKg, 0);
  console.log(`Generated scenario B: supply ${totalA} kg -> ${totalB} kg`);
  console.log(`Generated price history for ${scenarios.length} scenarios and ${Object.keys(pricesA).length} products`);
}

main();
