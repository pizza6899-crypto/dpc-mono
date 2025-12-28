import { ApiProperty } from '@nestjs/swagger';
import { DepositDetailStatus, ExchangeCurrencyCode } from '@repo/database';

export class BankDepositListItemDto {
  @ApiProperty({ description: '입금 상세 ID' })
  id: string;

  @ApiProperty({ description: '거래 ID' })
  transactionId: string;

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ description: '사용자 이메일' })
  userEmail: string | null;

  @ApiProperty({ description: '입금 통화', enum: ExchangeCurrencyCode })
  currency: ExchangeCurrencyCode;

  @ApiProperty({ description: '입금 금액' })
  amount: number;

  @ApiProperty({ description: '입금자명' })
  depositorName: string | null;

  @ApiProperty({ description: '은행명' })
  bankName: string | null;

  @ApiProperty({ description: '계좌번호' })
  accountNumber: string | null;

  @ApiProperty({ description: '예금주명' })
  accountHolder: string | null;

  @ApiProperty({ description: '상태', enum: DepositDetailStatus })
  status: DepositDetailStatus;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '확인일시', nullable: true })
  confirmedAt: Date | null;
}

export class BankDepositListResponseDto {
  @ApiProperty({ type: [BankDepositListItemDto] })
  items: BankDepositListItemDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;
}
