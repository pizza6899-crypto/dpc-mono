import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, TransactionStatus, TransactionType } from '@repo/database';
import { Prisma } from '@repo/database';

export class WalletTransactionDetailResponseDto {
    @ApiProperty({ description: '메인 잔액 변경량' })
    mainBalanceChange: string;

    @ApiProperty({ description: '변경 전 메인 잔액' })
    mainBeforeAmount: string;

    @ApiProperty({ description: '변경 후 메인 잔액' })
    mainAfterAmount: string;

    @ApiProperty({ description: '보너스 잔액 변경량' })
    bonusBalanceChange: string;

    @ApiProperty({ description: '변경 전 보너스 잔액' })
    bonusBeforeAmount: string;

    @ApiProperty({ description: '변경 후 보너스 잔액' })
    bonusAfterAmount: string;
}

export class WalletTransactionResponseDto {
    @ApiProperty({ description: '트랜잭션 ID' })
    id: string;

    @ApiProperty({ description: '사용자 ID' })
    userId: string;

    @ApiProperty({ description: '트랜잭션 타입', enum: TransactionType })
    type: TransactionType;

    @ApiProperty({ description: '상태', enum: TransactionStatus })
    status: TransactionStatus;

    @ApiProperty({ description: '통화', enum: ExchangeCurrencyCode })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: '거래 금액 (절대값)' })
    amount: string;

    @ApiProperty({ description: '변경 전 총 잔액' })
    beforeAmount: string;

    @ApiProperty({ description: '변경 후 총 잔액' })
    afterAmount: string;

    @ApiProperty({ description: '상세 내역 (메인/보너스 구분)' })
    detail: WalletTransactionDetailResponseDto;

    @ApiProperty({ description: '생성 일시' })
    createdAt: Date;
}

export class WalletTransactionHistoryResponseDto {
    @ApiProperty({ description: '트랜잭션 목록', type: [WalletTransactionResponseDto] })
    items: WalletTransactionResponseDto[];

    @ApiProperty({ description: '총 개수' })
    total: number;
}
