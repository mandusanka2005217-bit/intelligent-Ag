import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { Logger } from 'pino';
import { AppError } from '../errors';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `No route for ${req.method} ${req.originalUrl}`,
      requestId: (req as Request & { id?: string }).id,
    },
  });
}

/** Centralised error handler: every failure has the same JSON shape. */
export function createErrorHandler(logger: Logger) {
  return (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = (req as Request & { id?: string }).id;

    if (error instanceof ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.') || '(root)',
            message: issue.message,
          })),
          requestId,
        },
      });
      return;
    }

    if (error instanceof AppError) {
      if (error.status >= 500) logger.error({ err: error, requestId }, error.message);
      res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
        },
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    logger.error({ err: error, requestId }, 'Unhandled request error');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
        requestId,
      },
    });
  };
}
