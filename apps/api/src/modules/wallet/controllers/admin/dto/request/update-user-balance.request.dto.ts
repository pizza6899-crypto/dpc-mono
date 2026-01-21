// src/modules/wallet/controllers/admin/dto/request/update-user-balance.request.dto.ts
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  Matches,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, AdjustmentReasonCode, WalletBalanceType } from '@prisma/client';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import { UpdateOperation } from 'src/modules/wallet/domain/wallet.constant';

export class UpdateUserBalanceRequestDto {
  @ApiProperty({
    description: '통화 코드',
    enum: WALLET_CURRENCIES,
    example: ExchangeCurrencyCode.USDT,
  })
  @IsIn(WALLET_CURRENCIES, {
    message: 'Invalid currency code. Allowed values: ' + WALLET_CURRENCIES.join(', '),
  })
  @IsNotEmpty()
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '잔액 타입 (CASH: 메인 잔액, BONUS: 보너스 잔액, REWARD: 리워드, LOCK: 잠금, VAULT: 금고)',
    enum: WalletBalanceType,
    example: WalletBalanceType.CASH,
  })
  @IsEnum(WalletBalanceType, {
    message: 'Invalid balance type.',
  })
  @IsNotEmpty()
  balanceType: WalletBalanceType;

  @ApiProperty({
    description: '업데이트 연산 (add: 증가, subtract: 감소)',
    enum: UpdateOperation,
    example: UpdateOperation.ADD,
  })
  @IsEnum(UpdateOperation, {
    message: 'Invalid operation. Must be one of: add, subtract.',
  })
  @IsNotEmpty()
  operation: UpdateOperation;

  @ApiProperty({
    description: '변경할 금액 (양수, 소수점 포함 가능)',
    example: '100.50',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'Amount must be a positive number (e.g., "100" or "100.50").',
  })
  amount: string;

  @ApiProperty({
    description: '조정 사유 코드',
    enum: AdjustmentReasonCode,
    example: AdjustmentReasonCode.CS_RECOVERY,
  })
  @IsEnum(AdjustmentReasonCode)
  @IsNotEmpty()
  reasonCode: AdjustmentReasonCode;

  @ApiProperty({
    description: '관리자 내부 메모',
    example: '잘못된 배당에 따른 수동 조정',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  internalNote?: string;
}

