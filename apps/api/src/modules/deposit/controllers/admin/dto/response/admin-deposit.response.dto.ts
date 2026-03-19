import { ApiProperty } from '@nestjs/swagger';
import {
  DepositDetailStatus,
  DepositMethodType,
  PaymentProvider,
  ExchangeCurrencyCode,
} from '@prisma/client';

export class AdminDepositListItemDto {
  @ApiProperty({ description: '입금 상세 ID / Deposit detail ID' })
  id: string;

  @ApiProperty({ description: '사용자 ID / User ID' })
  userId: bigint;

  @ApiProperty({ description: '사용자 이메일 / User email' })
  userEmail: string;

  @ApiProperty({
    enum: DepositDetailStatus,
    description: '입금 상태 / Deposit status',
  })
  status: DepositDetailStatus;

  @ApiProperty({
    enum: DepositMethodType,
    description: '입금 방법 타입 / Deposit method type',
  })
  methodType: DepositMethodType;

  @ApiProperty({
    enum: PaymentProvider,
    description: '결제 대행사 / Payment provider',
  })
  provider: PaymentProvider;

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: '입금 통화 / Deposit currency',
  })
  depositCurrency: ExchangeCurrencyCode;

  @ApiProperty({ description: '신청 금액 / Requested amount' })
  requestedAmount: string;

  @ApiProperty({
    description: '실제 입금액 / Actually paid amount',
    required: false,
  })
  actuallyPaid: string | null;

  @ApiProperty({
    description: '트랜잭션 해시 / Transaction hash',
    required: false,
  })
  transactionHash: string | null;

  @ApiProperty({
    description: '처리 관리자 ID / Processed admin ID',
    required: false,
  })
  processedBy: string | null;

  @ApiProperty({
    description: '입금 확인 일시 / Confirmed at',
    required: false,
  })
  confirmedAt: Date | null;

  @ApiProperty({ description: '프로모션 ID / Promotion ID', required: false })
  promotionId: string | null;

  @ApiProperty({ description: '입금자명 / Depositor name', required: false })
  depositorName: string | null;

  @ApiProperty({ description: '입금 은행 / Depositor bank', required: false })
  depositorBank: string | null;

  @ApiProperty({
    description: '입금 계좌 / Depositor account',
    required: false,
  })
  depositorAccount: string | null;

  @ApiProperty({ description: 'IP 주소 / IP Address', required: false })
  ipAddress: string | null;

  @ApiProperty({ description: '생성 일시 / Created at' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시 / Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: '관리자 메모 / Admin memo' })
  memo: string;
}

export class ApproveDepositResponseDto {
  @ApiProperty({ description: '실제 입금액 / Actually paid amount' })
  actuallyPaid: string;

  @ApiProperty({ description: '보너스 지급액 / Bonus amount' })
  bonusAmount: string;

  @ApiProperty({ description: '대상 사용자 ID / Target User ID' })
  userId: string;
}

export class RejectDepositResponseDto {
  @ApiProperty({ description: '대상 사용자 ID / Target User ID' })
  userId: string;
}

export class ProcessDepositResponseDto {
  @ApiProperty({ description: '성공 여부 / Success status' })
  success: boolean;
}
