import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentHistoryController } from './controllers/payment-history.controller';
import { Payment } from './entities/payment.entity';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentHistoryService } from './services/payment-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentHistoryController],
  providers: [PaymentRepository, PaymentHistoryService],
  exports: [PaymentRepository, PaymentHistoryService],
})
export class PaymentModule {}
