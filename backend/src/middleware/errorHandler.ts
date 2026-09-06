import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  errorType?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorType = err.errorType || 'SERVER_ERROR';

  console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    success: false,
    message,
    error: errorType,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.method} ${req.originalUrl}' not found.`,
    error: 'NOT_FOUND',
  });
};
