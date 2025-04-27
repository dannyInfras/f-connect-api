import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';

import { httpLoggerConfig } from '../logger/pino-logger.config';

/**
 * Middleware that logs all incoming HTTP requests using a simplified format
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private httpLogger: ReturnType<typeof pinoHttp>;

  constructor() {
    this.httpLogger = pinoHttp({
      ...httpLoggerConfig,
      // Special setting for middleware to avoid double-logging
      autoLogging: {
        ignore: () => true, // Completely disable automatic logging
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Add request ID if not already present
    req.id =
      req.id ||
      (req.headers['x-request-id'] as string) ||
      Math.random().toString(36).substring(2, 12);

    // Store start time for response time calculation
    req._startTime = Date.now();

    // Skip logging for certain paths
    const path = req.url || '';
    const shouldSkipLogging =
      path === '/health' ||
      path === '/favicon.ico' ||
      path.startsWith('/docs') ||
      path.startsWith('/assets') ||
      path.startsWith('/public') ||
      path.includes('.js') ||
      path.includes('.css') ||
      path.includes('.ico') ||
      path.includes('.png') ||
      path.includes('.jpg') ||
      path.includes('.svg');

    // Setup response finished handler for minimal logging
    if (!shouldSkipLogging) {
      res.on('finish', () => {
        const responseTime = Date.now() - (req._startTime || Date.now());
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        });

        // Log in simplified format
        const logMessage = `[${timeStr}] INFO (${process.pid}): ${req.method} ${req.url} completed with status ${res.statusCode} in ${responseTime}ms`;

        // Log to console only (skip file logging for brevity)
        if (res.statusCode >= 500) {
          console.error(logMessage);
        } else if (res.statusCode >= 400) {
          console.warn(logMessage);
        } else {
          console.log(logMessage);
        }
      });
    }

    // Continue to next middleware or route handler
    next();
  }
}
