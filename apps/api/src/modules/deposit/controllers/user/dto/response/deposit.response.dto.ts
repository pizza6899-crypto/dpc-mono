import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DepositDetailStatus,
  DepositMethodType,
  ExchangeCurrencyCode,
} from '@prisma/client';

/**
 * 사용자 입금 상세/목록 정보 DTO
 */
export class UserDepositResponseDto {
  @ApiProperty({ description: 'Deposit Record ID' })
  id: string;

  @ApiProperty({ enum: DepositDetailStatus, description: 'Deposit status' })
  status: DepositDetailStatus;

  @ApiProperty({ enum: DepositMethodType, description: 'Deposit method type' })
  methodType: DepositMethodType;

  @ApiPropertyOptional({ description: 'Payment provider', nullable: true })
  provider?: string | null;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Deposit currency' })
  depositCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Network used (for crypto)', nullable: true })
  depositNetwork: string | null;

  @ApiProperty({ description: 'Requested amount' })
  requestedAmount: string;

  @ApiProperty({ description: 'Actually paid amount', nullable: true })
  actuallyPaid: string | null;

  @ApiProperty({ description: 'Deposit fee amount', nullable: true })
  feeAmount: string | null;

  @ApiProperty({
    description: 'Wallet address used (for crypto)',
    nullable: true,
  })
  walletAddress: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Confirmed at', nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({ description: 'Failed at', nullable: true })
  failedAt: Date | null;

  @ApiProperty({ description: 'Failure reason if failed', nullable: true })
  failureReason: string | null;
}

/**
 * 입금 취소 응답 DTO
 */
export class CancelDepositResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;
}
