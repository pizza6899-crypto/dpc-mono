import { ApiProperty } from '@nestjs/swagger';
import {
  DepositDetailStatus,
  DepositMethodType,
  PaymentProvider,
  ExchangeCurrencyCode,
} from '@repo/database';

export class AdminDepositListItemDto {
  @ApiProperty({ description: 'Deposit detail ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: bigint;

  @ApiProperty({ description: 'User email' })
  userEmail: string;

  @ApiProperty({ enum: DepositDetailStatus, description: 'Deposit status' })
  status: DepositDetailStatus;

  @ApiProperty({ enum: DepositMethodType, description: 'Deposit method type' })
  methodType: DepositMethodType;

  @ApiProperty({ enum: PaymentProvider, description: 'Payment provider' })
  provider: PaymentProvider;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Deposit currency' })
  depositCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Failure reason' })
  failureReason: string;
}

export class ApproveDepositResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Actually paid amount' })
  actuallyPaid: string;

  @ApiProperty({ description: 'Bonus amount' })
  bonusAmount: string;

  @ApiProperty({ description: 'Target User ID' })
  userId: string;
}

export class RejectDepositResponseDto {
  @ApiProperty({ description: 'Target User ID' })
  userId: string;
}

