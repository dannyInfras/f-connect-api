import * as fs from 'fs';
import { join } from 'path';
import pino from 'pino';
import { createStream } from 'rotating-file-stream';

// Configuration for log rotation
const logDirectory = join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

/**
 * Creates a stream for a specific log level with daily rotation
 * @param level Log level ('info', 'error', etc.)
 */
function createLogStream(level: string) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const filename = `${level}-${year}-${month}-${day}.log`;

  return createStream(filename, {
    interval: '1d', // Rotate daily
    path: logDirectory,
    size: '10M', // Also rotate if size exceeds 10 MB
    compress: 'gzip', // Compress rotated files
  });
}

// Create separate streams for different log levels
const errorStream = createLogStream('error');
const combinedStream = createLogStream('combined');

// Create a multistream for Pino
const streams = [
  // Log errors and fatals to error.log
  { level: 'error', stream: errorStream },
  // Log everything to combined.log
  { level: 'info', stream: combinedStream },
];

// Create a Pino logger configuration
const pinoConfig: pino.LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            messageFormat: '{msg}',
            ignore: 'pid,hostname,req,res',
            translateTime: 'HH:MM:ss.SSS',
            minimumLevel: 'info',
          },
        }
      : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
};

// For console output in development
const consoleLogger = pino(pinoConfig);

// For file output in all environments
const fileLogger = pino(
  {
    ...pinoConfig,
    transport: undefined, // Don't use pretty print for files
  },
  pino.multistream(streams),
);

/**
 * Combined logger that writes to both console and files
 */
export const logger = {
  info: (obj: object, msg?: string, ...args: any[]) => {
    consoleLogger.info(obj, msg, ...args);
    fileLogger.info(obj, msg, ...args);
  },
  error: (obj: object, msg?: string, ...args: any[]) => {
    consoleLogger.error(obj, msg, ...args);
    fileLogger.error(obj, msg, ...args);
  },
  warn: (obj: object, msg?: string, ...args: any[]) => {
    consoleLogger.warn(obj, msg, ...args);
    fileLogger.warn(obj, msg, ...args);
  },
  debug: (obj: object, msg?: string, ...args: any[]) => {
    consoleLogger.debug(obj, msg, ...args);
    fileLogger.debug(obj, msg, ...args);
  },
  trace: (obj: object, msg?: string, ...args: any[]) => {
    consoleLogger.trace(obj, msg, ...args);
    fileLogger.trace(obj, msg, ...args);
  },
  fatal: (obj: object, msg?: string, ...args: any[]) => {
    consoleLogger.fatal(obj, msg, ...args);
    fileLogger.fatal(obj, msg, ...args);
  },
  child: (bindings: pino.Bindings) => {
    const consoleChild = consoleLogger.child(bindings);
    const fileChild = fileLogger.child(bindings);

    return {
      info: (obj: object, msg?: string, ...args: any[]) => {
        consoleChild.info(obj, msg, ...args);
        fileChild.info(obj, msg, ...args);
      },
      error: (obj: object, msg?: string, ...args: any[]) => {
        consoleChild.error(obj, msg, ...args);
        fileChild.error(obj, msg, ...args);
      },
      warn: (obj: object, msg?: string, ...args: any[]) => {
        consoleChild.warn(obj, msg, ...args);
        fileChild.warn(obj, msg, ...args);
      },
      debug: (obj: object, msg?: string, ...args: any[]) => {
        consoleChild.debug(obj, msg, ...args);
        fileChild.debug(obj, msg, ...args);
      },
      trace: (obj: object, msg?: string, ...args: any[]) => {
        consoleChild.trace(obj, msg, ...args);
        fileChild.trace(obj, msg, ...args);
      },
      fatal: (obj: object, msg?: string, ...args: any[]) => {
        consoleChild.fatal(obj, msg, ...args);
        fileChild.fatal(obj, msg, ...args);
      },
    };
  },
};

// HTTP request logger middleware configuration
export const httpLoggerConfig = {
  logger: consoleLogger,
  // Custom serializers for request and response
  serializers: {
    req: (req: any) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
      responseTime: res.responseTime,
    }),
  },
  // Custom function to generate request ID
  genReqId: (req: any) => req.id || Math.random().toString(36).substring(2, 12),
  // Create a write stream to also log to file
  wrapSerializers: false,
  customLogLevel: (req: any, res: any, error?: Error) => {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    // Only use info level for non-debug paths
    if (req.url.includes('/docs') || req.url.includes('/health'))
      return 'debug';
    return 'info';
  },
  // Prevent detailed logging
  autoLogging: {
    ignore: () => true, // Disable automatic object logging
  },
  // Custom success message - simplified to only output the single line
  customSuccessMessage: (req: any, res: any) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });

    return `[${timeStr}] INFO (${process.pid}): ${req.method} ${req.url} completed with status ${res.statusCode} in ${res.responseTime}ms`;
  },
  // Custom error message - simplified to only include stack for 500+ errors
  customErrorMessage: (req: any, res: any, error?: Error) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });

    const errorMessage = error?.message || 'Unknown error';
    // Only include stack trace for server errors (500+)
    const stack = res.statusCode >= 500 ? error?.stack || '' : '';
    const logMessage = `[${timeStr}] ERROR (${process.pid}): ${req.method} ${req.url} failed with status ${res.statusCode}: ${errorMessage}`;

    return stack ? `${logMessage}\n${stack}` : logMessage;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'responseTime',
  },
};
