import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateCouponService } from '../../application/create-coupon.service';
import { GetCouponService } from '../../application/get-coupon.service';
import { Coupon } from '../../domain/coupon.entity';

@ApiTags('Admin | Coupon')
@Controller('admin/coupons')
export class CouponAdminController {
  constructor(
    private readonly createCouponService: CreateCouponService,
    private readonly getCouponService: GetCouponService,
  ) { }

  @Get(':code')
  @ApiOperation({ summary: 'Get coupon by code / 쿠폰 코드로 조회' })
  async getByCode(@Param('code') code: string): Promise<Coupon> {
    return this.getCouponService.getByCode(code);
  }
}
