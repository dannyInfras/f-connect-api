import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse,ApiTags } from '@nestjs/swagger';

import { CreateCouponDto } from '../dtos/create-coupon.dto';
import { UpdateCouponDto } from '../dtos/update-coupon.dto';
import { Coupon } from '../entities/coupon.entity';
import { CouponService } from '../services/coupon.service';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiResponse({
    status: 200,
    description: 'List of all coupons',
    type: [Coupon],
  })
  findAll(): Promise<Coupon[]> {
    return this.couponService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a coupon by id' })
  @ApiResponse({
    status: 200,
    description: 'The found coupon',
    type: Coupon,
  })
  @ApiResponse({
    status: 404,
    description: 'Coupon not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Coupon> {
    return this.couponService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiResponse({
    status: 201,
    description: 'The coupon has been successfully created',
    type: Coupon,
  })
  create(@Body() createCouponDto: CreateCouponDto): Promise<Coupon> {
    return this.couponService.create(createCouponDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiResponse({
    status: 200,
    description: 'The coupon has been successfully updated',
    type: Coupon,
  })
  @ApiResponse({
    status: 404,
    description: 'Coupon not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<Coupon> {
    return this.couponService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiResponse({
    status: 200,
    description: 'The coupon has been successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Coupon not found',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.couponService.remove(id);
  }
}
