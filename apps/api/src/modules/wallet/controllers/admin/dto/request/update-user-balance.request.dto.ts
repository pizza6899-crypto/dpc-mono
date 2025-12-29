// src/modules/wallet/controllers/admin/dto/request/update-user-balance.request.dto.ts
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@repo/database';
import {
  BalanceType,
  UpdateOperation,
} from '../../../../application/update-user-balance.service';

export class UpdateUserBalanceRequestDto {
  @ApiProperty({
    description: '통화 코드',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USDT,
  })
  @IsEnum(ExchangeCurrencyCode, {
    message: 'Invalid currency code.',
  })
  @IsNotEmpty()
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '잔액 타입 (main: 메인 잔액, bonus: 보너스 잔액, total: 총 잔액)',
    enum: BalanceType,
    example: BalanceType.MAIN,
  })
  @IsEnum(BalanceType, {
    message: 'Invalid balance type. Must be one of: main, bonus, total.',
  })
  @IsNotEmpty()
  balanceType: BalanceType;

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
}

