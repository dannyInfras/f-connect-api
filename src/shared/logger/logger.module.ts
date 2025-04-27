import { Module } from '@nestjs/common';

import { AppLogger } from './logger.service';
import { logger } from './pino-logger.config';

@Module({
  imports: [],
  providers: [
    AppLogger,
    {
      provide: 'PINO_LOGGER',
      useValue: logger,
    },
  ],
  exports: [AppLogger, 'PINO_LOGGER'],
})
export class AppLoggerModule {}
