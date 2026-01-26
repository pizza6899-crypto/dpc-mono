import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode, UserWalletTransactionType, UserWalletBalanceType } from '@prisma/client';

export class UserWalletTransactionResponseDto {
    @ApiProperty({ description: 'Encoded Transaction ID (Sqid) / 인코딩된 트랜잭션 ID (Sqid)' })
    id: string;

    @ApiProperty({ description: 'Transaction type / 트랜잭션 타입', enum: UserWalletTransactionType })
    type: UserWalletTransactionType;

    @ApiProperty({ description: 'Balance type / 잔액 타입', enum: UserWalletBalanceType })
    balanceType: UserWalletBalanceType;

    @ApiProperty({ description: 'Currency / 통화', enum: ExchangeCurrencyCode })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Transaction amount (signed) / 거래 금액 (부호 포함 변동량)' })
    amount: string;

    @ApiProperty({ description: 'Balance before transaction / 거래 전 잔액' })
    balanceBefore: string;

    @ApiProperty({ description: 'Balance after transaction / 거래 후 잔액' })
    balanceAfter: string;

    @ApiProperty({ description: 'Created at / 생성 일시' })
    createdAt: Date;
}
