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

  @ApiProperty({ enum: ExchangeCurrencyCode, description: '입금 통화 / Deposit currency' })
  depositCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: '네트워크 (암호화폐 입금 시) / Payment network', nullable: true })
  depositNetwork: string | null;

  @ApiProperty({ description: '신청 금액 / Requested amount' })
  requestedAmount: string;

  @ApiProperty({
    description: '결제 주소 (암호화폐 입금 시) / Payment address',
    nullable: true,
  })
  walletAddress: string | null;

  @ApiProperty({ description: '생성 일시 / Created at' })
  createdAt: Date;

  @ApiProperty({ description: '본인 확인/완료 일시 / Confirmed/Completed at', nullable: true })
  confirmedAt: Date | null;
}
