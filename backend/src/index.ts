import pino from 'pino';
import { PORT, LOG_LEVEL, SIMULATED } from './config';
import { createApp } from './app';
import { loadData } from './data/loader';
import { DataStore, setStore } from './data/store';

const logger = pino({
  level: LOG_LEVEL,
});

function start(): void {
  const loaded = loadData();
  const store = new DataStore(loaded);
  setStore(store);

  const app = createApp(store, { logger });
  const server = app.listen(PORT, () => {
    const scenarios = store.listScenarios();
    logger.info(
      {
        port: PORT,
        simulated: SIMULATED,
        scenarios: scenarios.map((scenario) => ({
          id: scenario.id,
          farmers: scenario.totals.farmerCount,
          buyers: scenario.totals.buyerCount,
        })),
      },
      'AgriSupply API ready',
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

try {
  start();
} catch (error) {
  logger.fatal({ err: error }, 'Failed to start API — check the simulated data files');
  process.exit(1);
}
