import { ApiProperty } from '@nestjs/swagger';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import type { WalletCurrencyCode } from 'src/utils/currency.util';
import { WalletStatus } from '@prisma/client';

export class UserWalletResponseDto {
    @ApiProperty({
        description: 'Currency / 통화',
        enum: WALLET_CURRENCIES,
        example: 'USDT',
    })
    currency: WalletCurrencyCode;

    @ApiProperty({
        description: 'Cash balance / 캐시 잔액',
        example: '1000.00',
        type: String,
    })
    cashBalance: string;

    @ApiProperty({
        description: 'Bonus balance / 보너스 잔액',
        example: '500.00',
        type: String,
    })
    bonusBalance: string;

    @ApiProperty({
        description: 'Reward balance / 리워드 잔액',
        example: '100.00',
        type: String,
    })
    rewardBalance: string;

    @ApiProperty({
        description: 'Locked balance / 잠긴 잔액',
        example: '0.00',
        type: String,
    })
    lockedBalance: string;

    @ApiProperty({
        description: 'Vault balance / 금고 잔액',
        example: '2000.00',
        type: String,
    })
    vaultBalance: string;

    @ApiProperty({
        description: 'Total available balance (Cash + Bonus) / 총 가용 잔액 (캐시 + 보너스)',
        example: '1500.00',
        type: String,
    })
    totalBalance: string;

    @ApiProperty({
        description: 'Wallet status / 지갑 상태',
        enum: WalletStatus,
        example: WalletStatus.ACTIVE,
    })
    status: WalletStatus;
}

export class UserWalletListResponseDto {
    @ApiProperty({
        description: 'User wallet list / 사용자 지갑 목록',
        type: [UserWalletResponseDto],
    })
    wallets: UserWalletResponseDto[];
}
