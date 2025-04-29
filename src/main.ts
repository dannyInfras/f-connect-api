import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { VALIDATION_PIPE_OPTIONS } from './shared/constants';
import { logger } from './shared/logger/pino-logger.config';
import { RequestIdMiddleware } from './shared/middlewares/request-id/request-id.middleware';

async function bootstrap() {
  try {
    // Create app and disable default logger
    const app = await NestFactory.create(AppModule, {
      logger: false,
      bufferLogs: true,
    });

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
    app.use(RequestIdMiddleware);
    app.enableCors();

    /** Swagger configuration*/
    const options = new DocumentBuilder()
      .setTitle('FConnect API')
      .setDescription('FConnect API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port');
    await app.listen(port || 3000);

    logger.info({ module: 'Bootstrap' }, `Server is running on port ${port}`);
  } catch (error) {
    logger.error({ module: 'Bootstrap', error }, 'Failed to start application');
    process.exit(1);
  }
}

bootstrap();
