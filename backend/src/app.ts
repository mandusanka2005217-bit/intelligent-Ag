import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import express from 'express';
import type { Request } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import pino from 'pino';
import type { Logger } from 'pino';
import type { DataStore } from './data/store';
import { FRONTEND_DIST, LOG_LEVEL, NODE_ENV } from './config';
import { createApiRouter } from './routes';
import { createErrorHandler, notFoundHandler } from './middleware/error';

export interface AppOptions {
  logger?: Logger;
  serveFrontend?: boolean;
}

/**
 * Build the Express application. Exported separately from index.ts so tests can
 * mount it with supertest and an in-memory store.
 */
export function createApp(store: DataStore, options: AppOptions = {}) {
  const logger =
    options.logger ??
    pino({
      level: NODE_ENV === 'test' ? 'silent' : LOG_LEVEL,
    });

  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    (req as Request & { id: string }).id = id;
    res.setHeader('x-request-id', id);
    next();
  });

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as Request & { id?: string }).id ?? randomUUID(),
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', createApiRouter(store));

  // Unknown /api routes stay JSON.
  app.use('/api', notFoundHandler);

  const hasFrontend = fs.existsSync(path.join(FRONTEND_DIST, 'index.html'));
  if (options.serveFrontend !== false && hasFrontend) {
    app.use(express.static(FRONTEND_DIST, { maxAge: '1h', index: false }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));
  return app;
}
