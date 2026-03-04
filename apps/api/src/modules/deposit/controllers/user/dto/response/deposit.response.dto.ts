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
  @ApiProperty({ description: '입금 기록 ID / Deposit Record ID' })
  id: string;

  @ApiProperty({ enum: DepositDetailStatus, description: '입금 상태 / Deposit status' })
  status: DepositDetailStatus;

  @ApiProperty({ enum: DepositMethodType, description: '입금 방법 타입 / Deposit method type' })
  methodType: DepositMethodType;

  @ApiPropertyOptional({ description: '결제 대행사 / Payment provider', nullable: true })
  provider?: string | null;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: '입금 통화 / Deposit currency' })
  depositCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: '네트워크 (암호화폐 입금 시) / Payment network', nullable: true })
  depositNetwork: string | null;

  @ApiProperty({ description: '신청 금액 / Requested amount' })
  requestedAmount: string;

  @ApiProperty({ description: '실제 입금 금액 / Actually paid amount', nullable: true })
  actuallyPaid: string | null;

  @ApiProperty({ description: '입금 수수료 / Deposit fee amount', nullable: true })
  feeAmount: string | null;

  @ApiProperty({
    description: '결제 주소 (암호화폐 입금 시) / Payment address',
    nullable: true,
  })
  walletAddress: string | null;

  @ApiProperty({ description: '생성 일시 / Created at' })
  createdAt: Date;

  @ApiProperty({ description: '승인/완료 일시 / Confirmed/Completed at', nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({ description: '실패/취소 일시 / Failed/Cancelled at', nullable: true })
  failedAt: Date | null;

  @ApiProperty({ description: '실패/거절 사유 / Failure/Rejection reason', nullable: true })
  failureReason: string | null;
}

/**
 * 입금 취소 응답 DTO
 */
export class CancelDepositResponseDto {
  @ApiProperty({ description: '성공 여부 / Success status' })
  success: boolean;
}
