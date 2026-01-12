import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WithdrawalStatus, WithdrawalMethodType, WithdrawalProcessingMode, ExchangeCurrencyCode } from '@repo/database';
export class WithdrawalResponseDto {
    @ApiProperty({ description: 'Withdrawal ID (Encoded)', example: 'w_abc123' })
    id!: string;

    @ApiProperty({ description: 'Status', enum: WithdrawalStatus })
    status!: WithdrawalStatus;

    @ApiProperty({ description: 'Method type', enum: WithdrawalMethodType })
    methodType!: WithdrawalMethodType;

    @ApiProperty({ description: 'Processing mode', enum: WithdrawalProcessingMode })
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

    @ApiPropertyOptional({ description: 'Transaction hash' })
    transactionHash?: string;

    @ApiPropertyOptional({ description: 'Failure reason' })
    failureReason?: string;

    @ApiProperty({ description: 'Created at' })
    createdAt!: Date;

    @ApiPropertyOptional({ description: 'Confirmed at' })
    confirmedAt?: Date;

    @ApiPropertyOptional({ description: 'Cancelled at' })
    cancelledAt?: Date;
}

export class CreateWithdrawalResponseDto {
    @ApiProperty({ description: 'Withdrawal ID (Encoded)', example: 'w_abc123' })
    withdrawalId!: string;

    @ApiProperty({ description: 'Status', enum: WithdrawalStatus })
    status!: string;

    @ApiProperty({ description: 'Processing mode', enum: WithdrawalProcessingMode })
    processingMode!: string;

    @ApiProperty({ description: 'Requested amount' })
    requestedAmount!: string;

    @ApiPropertyOptional({ description: 'Fee amount' })
    feeAmount?: string;

    @ApiProperty({ description: 'Net amount' })
    netAmount!: string;
}

export class CancelWithdrawalResponseDto {
    @ApiProperty({ description: 'Withdrawal ID (Encoded)', example: 'w_abc123' })
    withdrawalId!: string;

    @ApiProperty({ description: 'Status', enum: WithdrawalStatus })
    status!: string;

    @ApiProperty({ description: 'Cancelled at' })
    cancelledAt!: Date;
}
