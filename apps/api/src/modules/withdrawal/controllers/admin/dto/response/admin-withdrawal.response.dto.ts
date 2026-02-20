import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WithdrawalStatus,
  WithdrawalMethodType,
  WithdrawalProcessingMode,
  ExchangeCurrencyCode,
} from '@prisma/client';
import { WithdrawalDetail } from '../../../../domain';

export class AdminWithdrawalResponseDto {
  @ApiProperty({ description: 'Withdrawal ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Status', enum: WithdrawalStatus })
  status!: WithdrawalStatus;

  @ApiProperty({ description: 'Method type', enum: WithdrawalMethodType })
  methodType!: WithdrawalMethodType;

  @ApiProperty({
    description: 'Processing mode',
    enum: WithdrawalProcessingMode,
  })
  processingMode!: WithdrawalProcessingMode;

  @ApiProperty({ description: 'Currency', enum: ExchangeCurrencyCode })
  currency!: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Requested amount' })
  requestedAmount!: string;

  @ApiPropertyOptional({ description: 'Fee amount' })
  feeAmount?: string;

  @ApiPropertyOptional({ description: 'Net amount' })
  netAmount?: string;

  @ApiPropertyOptional({ description: 'Network' })
  network?: string;

  @ApiPropertyOptional({ description: 'Wallet address' })
  walletAddress?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account number' })
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Account holder' })
  accountHolder?: string;

  @ApiPropertyOptional({ description: 'Transaction hash' })
  transactionHash?: string;

  @ApiPropertyOptional({ description: 'Provider withdrawal ID' })
  providerWithdrawalId?: string;

  @ApiPropertyOptional({ description: 'Processed by admin ID' })
  processedBy?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  adminNotes?: string[];

  @ApiPropertyOptional({ description: 'Failure reason' })
  failureReason?: string;

  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Confirmed at' })
  confirmedAt?: Date;

  @ApiPropertyOptional({ description: 'Failed at' })
  failedAt?: Date;

  @ApiPropertyOptional({ description: 'Cancelled at' })
  cancelledAt?: Date;

  static fromDomain(withdrawal: WithdrawalDetail): AdminWithdrawalResponseDto {
    return {
      id: withdrawal.id.toString(),
      userId: withdrawal.userId.toString(),
      status: withdrawal.status,
      methodType: withdrawal.methodType,
      processingMode: withdrawal.processingMode,
      currency: withdrawal.currency,
      requestedAmount: withdrawal.requestedAmount.toString(),
      feeAmount: withdrawal.props.feeAmount?.toString(),
      netAmount: withdrawal.props.netAmount?.toString(),
      network: withdrawal.props.network ?? undefined,
      walletAddress: withdrawal.props.walletAddress ?? undefined,
      bankName: withdrawal.props.bankName ?? undefined,
      accountNumber: withdrawal.props.accountNumber ?? undefined,
      accountHolder: withdrawal.props.accountHolder ?? undefined,
      transactionHash: withdrawal.props.transactionHash ?? undefined,
      providerWithdrawalId: withdrawal.props.providerWithdrawalId ?? undefined,
      processedBy: withdrawal.props.processedBy?.toString(),
      adminNotes: withdrawal.props.adminNotes,
      failureReason: withdrawal.props.failureReason ?? undefined,
      ipAddress: withdrawal.props.ipAddress ?? undefined,
      createdAt: withdrawal.props.createdAt,
      updatedAt: withdrawal.props.updatedAt,
      confirmedAt: withdrawal.props.confirmedAt ?? undefined,
      failedAt: withdrawal.props.failedAt ?? undefined,
      cancelledAt: withdrawal.props.cancelledAt ?? undefined,
    };
  }
}

export class ApproveWithdrawalResponseDto {
  @ApiProperty({ description: 'Withdrawal ID' })
  withdrawalId!: string;

  @ApiProperty({ description: 'Status', enum: WithdrawalStatus })
  status!: string;

  @ApiProperty({ description: 'Processed by admin ID' })
  processedBy!: string;
}

export class RejectWithdrawalResponseDto {
  @ApiProperty({ description: 'Withdrawal ID' })
  withdrawalId!: string;

  @ApiProperty({ description: 'Status', enum: WithdrawalStatus })
  status!: string;

  @ApiProperty({ description: 'Processed by admin ID' })
  processedBy!: string;

  @ApiProperty({ description: 'Rejection reason' })
  reason!: string;
}
