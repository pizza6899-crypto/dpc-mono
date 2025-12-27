import { ApiProperty } from '@nestjs/swagger';
import {
  DepositDetailStatus,
  DepositMethodType,
  PaymentProvider,
  ExchangeCurrencyCode,
} from '@prisma/client';

export class AdminDepositListItemDto {
  @ApiProperty({ description: 'Deposit detail ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  userEmail: string;

  @ApiProperty({ description: 'User numeric ID' })
  userNumericId: number;

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
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Actually paid amount' })
  actuallyPaid: string;

  @ApiProperty({ description: 'Bonus amount' })
  bonusAmount: string;
}

export class RejectDepositResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;
}
