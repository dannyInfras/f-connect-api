import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Coupon } from '../entities/coupon.entity';

@Injectable()
export class CouponRepository extends Repository<Coupon> {
  constructor(private dataSource: DataSource) {
    super(Coupon, dataSource.createEntityManager());
  }
}
