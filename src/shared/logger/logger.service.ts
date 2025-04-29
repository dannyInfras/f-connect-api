import { Injectable, Scope } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { RequestContext } from '../request-context/request-context.dto';
import { logger } from './pino-logger.config';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private context?: string;

  public setContext(context: string): void {
    this.context = context;
  }

  constructor() {}

  /**
   * Creates a formatted log string with timestamp and process ID
   */
  private formatLogMessage(
    level: string,
    message: string,
    context?: string,
  ): string {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });

    const ctx = context || this.context || 'Application';
    return `[${timeStr}] ${level.toUpperCase()} (${process.pid}): [${ctx}] ${message}`;
  }

  /**
   * Logs error directly to file without console output
   * Use this for detailed error logging
   */
  logError(
    ctx: RequestContext,
    message: string,
    trace?: string,
    meta?: Record<string, any>,
  ): void {
    // Log to file via pino logger
    logger.error(
      {
        context: this.context || 'Application',
        requestId: ctx.requestID,
        user: ctx.user?.id,
        ...meta,
        trace,
      },
      message,
    );

    // Also write to a dedicated error log file
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const errorLogPath = path.join(
        logDir,
        `error-${year}-${month}-${day}.log`,
      );

      // Ensure logs directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Use the exact format requested for error logging
      const errorData = meta?.error || {
        statusCode: 500,
        message,
        errorName: 'InternalServerError',
        details: 'Unknown error',
        path: meta?.path || 'unknown',
        requestId: ctx.requestID,
        timestamp: new Date().toISOString(),
      };

      // Add stack trace if available
      if (trace) {
        errorData.stackTrace = trace;
      }

      // Append to error log file with the exact structure requested
      fs.appendFileSync(
        errorLogPath,
        JSON.stringify({ error: errorData }, null, 2) + '\n',
        { encoding: 'utf8' },
      );
    } catch (e: unknown) {
      // If file logging fails, log to console
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error(`Failed to write to error log file: ${errorMessage}`);
    }
  }

  /**
   * Uses simplified console logging to prevent verbose output
   */
  error(
    ctx: RequestContext,
    message: string,
    trace?: string,
    meta?: Record<string, any>,
  ): void {
    const logMessage = this.formatLogMessage('ERROR', message);
    console.error(logMessage);

    if (trace) {
      console.error(trace);
    }

    // Log to file using the dedicated method
    this.logError(ctx, message, trace, meta);
  }

  warn(ctx: RequestContext, message: string, meta?: Record<string, any>): void {
    console.warn(this.formatLogMessage('WARN', message));

    // Keep file logging
    logger.warn(
      {
        context: this.context || 'Application',
        requestId: ctx.requestID,
        user: ctx.user?.id,
        ...meta,
      },
      message,
    );
  }

  debug(
    ctx: RequestContext,
    message: string,
    meta?: Record<string, any>,
  ): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLogMessage('DEBUG', message));
    }

    // Keep file logging
    logger.debug(
      {
        context: this.context || 'Application',
        requestId: ctx.requestID,
        user: ctx.user?.id,
        ...meta,
      },
      message,
    );
  }

  verbose(
    ctx: RequestContext,
    message: string,
    meta?: Record<string, any>,
  ): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatLogMessage('TRACE', message));
    }

    // Keep file logging
    logger.trace(
      {
        context: this.context || 'Application',
        requestId: ctx.requestID,
        user: ctx.user?.id,
        ...meta,
      },
      message,
    );
  }

  log(ctx: RequestContext, message: string, meta?: Record<string, any>): void {
    console.log(this.formatLogMessage('INFO', message));

    // Keep file logging
    logger.info(
      {
        context: this.context || 'Application',
        requestId: ctx.requestID,
        user: ctx.user?.id,
        ...meta,
      },
      message,
    );
  }
}
