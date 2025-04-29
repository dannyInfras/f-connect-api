import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import pinoHttp from 'pino-http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AppLogger } from '../logger/logger.service';
import { httpLoggerConfig } from '../logger/pino-logger.config';
import { createRequestContext } from '../request-context/util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private httpLogger: ReturnType<typeof pinoHttp>;

  constructor(private appLogger: AppLogger) {
    this.appLogger.setContext(LoggingInterceptor.name);
    this.httpLogger = pinoHttp(httpLoggerConfig);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();

      // Use Pino HTTP to log request
      this.httpLogger(request, response);

      // Create request context for other app logs
      const ctx = createRequestContext(request);

      // Set start time on request for response time tracking
      request._startTime = Date.now();

      return next.handle().pipe(
        tap(() => {
          // Calculate response time
          const responseTime = Date.now() - request._startTime;

          // Add responseTime to response for Pino HTTP logger
          response.responseTime = responseTime;

          const statusCode = response.statusCode;
          const method = request.method;

          // Log only completed requests with detailed info
          if (statusCode >= 500) {
            this.appLogger.error(
              ctx,
              `Request failed: ${method} ${request.url}`,
              undefined,
              { statusCode, responseTime, method },
            );
          } else if (statusCode >= 400) {
            this.appLogger.warn(
              ctx,
              `Request error: ${method} ${request.url}`,
              { statusCode, responseTime, method },
            );
          } else {
            this.appLogger.log(
              ctx,
              `Request completed: ${method} ${request.url}`,
              { statusCode, responseTime, method },
            );
          }
        }),
      );
    }

    // For non-HTTP contexts (WebSockets, gRPC, etc.)
    return next.handle();
  }
}
