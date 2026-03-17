// src/modules/promotion/controllers/admin/dto/request/upsert-currency-settings.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';

export class UpsertCurrencySettingsRequestDto {
  @ApiProperty({
    description: 'Currency code / 통화 코드',
    example: ExchangeCurrencyCode.USDT,
    enum: ExchangeCurrencyCode,
  })
  @IsNotEmpty()
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Minimum deposit amount / 최소 입금 금액',
    example: '10.00',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  minDepositAmount: string;

  @ApiPropertyOptional({
    description: 'Maximum recognized deposit amount / 최대 입금 인정 금액',
    example: '1000.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  maxDepositAmount?: string;

  @ApiPropertyOptional({
    description: 'Maximum bonus amount / 최대 보너스 금액',
    example: '100.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  maxBonusAmount?: string;

  @ApiPropertyOptional({
    description: 'Maximum withdrawal amount / 최대 출금 금액',
    example: '500.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  maxWithdrawAmount?: string;

  @ApiPropertyOptional({
    description: 'Bonus rate / 보너스 비율',
    example: '1.0',
    type: String,
  })
  @IsOptional()
  @IsString()
  bonusRate?: string;

  @ApiPropertyOptional({
    description: 'Wagering multiplier / 웨이저링 배수',
    example: '20.0',
    type: String,
  })
  @IsOptional()
  @IsString()
  wageringMultiplier?: string;
}
