// src/modules/promotion/controllers/user/dto/request/apply-coupon.request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';

export class ApplyCouponRequestDto {
  @ApiProperty({
    description: '쿠폰 코드',
    example: 'FREE10',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: '통화 코드',
    example: ExchangeCurrencyCode.USDT,
    enum: ExchangeCurrencyCode,
  })
  @IsNotEmpty()
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;
}
