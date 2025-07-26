import { Module } from '@nestjs/common';

import { CouponController } from './controllers/coupon.controller';
import { CouponRepository } from './repositories/coupon.repository';
import { CouponService } from './services/coupon.service';

@Module({
  controllers: [CouponController],
  providers: [CouponService, CouponRepository],
  exports: [CouponService],
})
export class CouponModule {}
