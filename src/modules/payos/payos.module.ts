import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PayosController } from './controllers/payos.controller';
import { PayosService } from './services/payos.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [PayosController],
  providers: [PayosService],
  exports: [PayosService],
})
export class PayosModule {}
