// src/modules/promotion/controllers/admin/dto/request/upsert-currency-settings.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@repo/database';

export class UpsertCurrencySettingsRequestDto {
  @ApiProperty({
    description: '통화 코드',
    example: ExchangeCurrencyCode.USDT,
    enum: ExchangeCurrencyCode,
  })
  @IsNotEmpty()
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '최소 입금 금액',
    example: '10.00',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  minDepositAmount: string;

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

