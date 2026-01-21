import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, WalletTransactionType, AdjustmentReasonCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class WalletBalanceDetailResponseDto {
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

export class WalletAdminDetailResponseDto {
    @ApiProperty({ description: '관리자 ID' })
    adminUserId: string;

    @ApiProperty({ description: '사유 코드', enum: AdjustmentReasonCode })
    reasonCode: AdjustmentReasonCode;

    @ApiProperty({ description: '상세 메모' })
    internalNote?: string;
}

export class WalletSystemDetailResponseDto {
    @ApiProperty({ description: '서비스명' })
    serviceName: string;

    @ApiProperty({ description: '트리거 ID' })
    triggerId?: string;

    @ApiProperty({ description: '액션명' })
    actionName: string;

    @ApiProperty({ description: '메타데이터' })
    metadata?: any;
}

export class WalletTransactionResponseDto {
    @ApiProperty({ description: '트랜잭션 ID' })
    id: string;

    @ApiProperty({ description: '사용자 ID' })
    userId: string;

    @ApiProperty({ description: '트랜잭션 타입', enum: WalletTransactionType })
    type: WalletTransactionType;

    @ApiProperty({ description: '상태' })
    status: string;

    @ApiProperty({ description: '통화', enum: ExchangeCurrencyCode })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: '거래 금액 (절대값)' })
    amount: string;

    @ApiProperty({ description: '변경 전 총 잔액' })
    beforeAmount: string;

    @ApiProperty({ description: '변경 후 총 잔액' })
    afterAmount: string;

    @ApiProperty({ description: '잔액 상세 내역 (메인/보너스 구분)' })
    balanceDetail: WalletBalanceDetailResponseDto;

    @ApiProperty({ description: '관리자 수동 조작 상세', required: false })
    adminDetail?: WalletAdminDetailResponseDto;

    @ApiProperty({ description: '시스템 자동 처리 상세', required: false })
    systemDetail?: WalletSystemDetailResponseDto;

    @ApiProperty({ description: '생성 일시' })
    createdAt: Date;
}

export class WalletTransactionHistoryResponseDto {
    @ApiProperty({ description: '트랜잭션 목록', type: [WalletTransactionResponseDto] })
    items: WalletTransactionResponseDto[];

    @ApiProperty({ description: '총 개수' })
    total: number;
}
