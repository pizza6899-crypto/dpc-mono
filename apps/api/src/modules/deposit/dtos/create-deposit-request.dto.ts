// src/modules/deposit/dtos/create-deposit-request.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { WalletCurrencyCode } from 'src/utils/currency.util';
import { DepositMethodType, ExchangeCurrencyCode } from '@repo/database';

export class CreateDepositRequestDto {
  @ApiPropertyOptional({
    description: 'Deposit promotion ID (입금 프로모션 ID)',
  })
  @IsOptional()
  @IsNumber()
  depositPromotionId?: number;

  @ApiProperty({
    description: 'Deposit method type (입금 방법)',
    example: DepositMethodType.CRYPTO_WALLET,
    enum: DepositMethodType,
    default: DepositMethodType.CRYPTO_WALLET,
  })
  @IsOptional()
  @IsEnum(DepositMethodType)
  methodType?: DepositMethodType;

  @ApiProperty({
    description: 'Currency to deposit (입금할 통화)',
    example: ExchangeCurrencyCode.USDT,
  })
  @IsNotEmpty()
  @IsString()
  payCurrency: WalletCurrencyCode;

  @ApiPropertyOptional({
    description:
      'Network to use for deposit (입금 진행할 네트워크) - 암호화폐 입금 시 필수',
    example: 'ethereum',
  })
  @ValidateIf((o) => o.methodType === DepositMethodType.CRYPTO_WALLET)
  @IsNotEmpty()
  @IsString()
  payNetwork?: string;

  @ApiPropertyOptional({
    description: 'Deposit amount (입금 금액) - 무통장 입금 시 필수',
    example: 100000,
  })
  @ValidateIf((o) => o.methodType === DepositMethodType.BANK_TRANSFER)
  @IsNotEmpty()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Depositor name (입금자명) - 무통장 입금 시 필수',
    example: '김철수',
  })
  @ValidateIf((o) => o.methodType === DepositMethodType.BANK_TRANSFER)
  @IsNotEmpty()
  @IsString()
  depositorName?: string;
}

