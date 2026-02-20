// src/modules/promotion/controllers/admin/dto/request/upsert-currency-settings.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';

export class UpsertCurrencySettingsRequestDto {
  @ApiProperty({
    description: '통화 코드',
    example: ExchangeCurrencyCode.USDT,
    enum: ExchangeCurrencyCode,
  })
  @IsNotEmpty()
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    description: '최소 입금 금액 (입금형 프로모션인 경우 필수)',
    example: '10.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  minDepositAmount?: string;

  @ApiPropertyOptional({
    description: '최대 보너스 금액',
    example: '1000.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  maxBonusAmount?: string;

  @ApiPropertyOptional({
    description: '최대 출금 금액',
    example: '5000.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  maxWithdrawAmount?: string;
}
