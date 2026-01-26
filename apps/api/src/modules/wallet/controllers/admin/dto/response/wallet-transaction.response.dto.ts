import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, UserWalletTransactionType, AdjustmentReasonCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class WalletBalanceDetailResponseDto {
    @ApiProperty({ description: 'Main Balance Change / 메인 잔액 변경량' })
    mainBalanceChange: string;

    @ApiProperty({ description: 'Main Balance Before / 변경 전 메인 잔액' })
    mainBeforeAmount: string;

    @ApiProperty({ description: 'Main Balance After / 변경 후 메인 잔액' })
    mainAfterAmount: string;

    @ApiProperty({ description: 'Bonus Balance Change / 보너스 잔액 변경량' })
    bonusBalanceChange: string;

    @ApiProperty({ description: 'Bonus Balance Before / 변경 전 보너스 잔액' })
    bonusBeforeAmount: string;

    @ApiProperty({ description: 'Bonus Balance After / 변경 후 보너스 잔액' })
    bonusAfterAmount: string;
}

export class WalletAdminDetailResponseDto {
    @ApiProperty({ description: 'Admin User ID / 관리자 ID' })
    adminUserId: string;

    @ApiProperty({ description: 'Adjustment Reason Code / 사유 코드', enum: AdjustmentReasonCode })
    reasonCode: AdjustmentReasonCode;

    @ApiProperty({ description: 'Internal Note / 상세 메모' })
    internalNote?: string;
}

export class WalletSystemDetailResponseDto {
    @ApiProperty({ description: 'Service Name / 서비스명' })
    serviceName: string;

    @ApiProperty({ description: 'Trigger ID / 트리거 ID' })
    triggerId?: string;

    @ApiProperty({ description: 'Action Name / 액션명' })
    actionName: string;

    @ApiProperty({ description: 'Metadata / 메타데이터' })
    metadata?: any;
}

export class WalletTransactionResponseDto {
    @ApiProperty({ description: 'Transaction ID / 트랜잭션 ID' })
    id: string;

    @ApiProperty({ description: 'User ID / 사용자 ID' })
    userId: string;

    @ApiProperty({ description: 'Transaction Type / 트랜잭션 타입', enum: UserWalletTransactionType })
    type: UserWalletTransactionType;

    @ApiProperty({ description: 'Status / 상태' })
    status: string;

    @ApiProperty({ description: 'Currency Code / 통화', enum: ExchangeCurrencyCode })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Transaction Amount (Absolute value) / 거래 금액 (절대값)' })
    amount: string;

    @ApiProperty({ description: 'Total Balance Before / 변경 전 총 잔액' })
    beforeAmount: string;

    @ApiProperty({ description: 'Total Balance After / 변경 후 총 잔액' })
    afterAmount: string;

    @ApiProperty({ description: 'Detailed Balance Change (Main/Bonus) / 잔액 상세 내역 (메인/보너스 구분)' })
    balanceDetail: WalletBalanceDetailResponseDto;

    @ApiProperty({ description: 'Admin Manual Adjustment Detail / 관리자 수동 조작 상세', required: false })
    adminDetail?: WalletAdminDetailResponseDto;

    @ApiProperty({ description: 'System Automatic Processing Detail / 시스템 자동 처리 상세', required: false })
    systemDetail?: WalletSystemDetailResponseDto;

    @ApiProperty({ description: 'Created At / 생성 일시' })
    createdAt: Date;
}

export class WalletTransactionHistoryResponseDto {
    @ApiProperty({ description: 'Transaction List / 트랜잭션 목록', type: [WalletTransactionResponseDto] })
    items: WalletTransactionResponseDto[];

    @ApiProperty({ description: 'Total Items / 총 개수' })
    total: number;
}
