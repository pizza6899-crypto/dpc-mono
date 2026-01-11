import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { GAMING_CURRENCIES, WALLET_CURRENCIES } from 'src/utils/currency.util';
import type {
    GamingCurrencyCode,
    WalletCurrencyCode,
} from 'src/utils/currency.util';

export class GameLaunchRequestDto {
    @ApiProperty({
        description: 'Game ID (Sqid)',
        example: 'cg_abcdef123',
    })
    @IsString()
    id: string;

    @ApiProperty({
        description: 'Is Mobile (모바일 여부)',
        example: true,
        type: Boolean,
    })
    @IsBoolean()
    isMobile: boolean;

    @ApiProperty({
        description:
            'Wallet Currency (유저 월렛 통화) - 유저 잔액에서 사용할 암호화폐',
        example: WALLET_CURRENCIES[0],
        enum: Object.values(WALLET_CURRENCIES),
    })
    @IsEnum(WALLET_CURRENCIES)
    walletCurrency: WalletCurrencyCode;

    @ApiProperty({
        description: 'Game Currency (게임 표시 통화) - 게임에서 표시할 피아트 통화',
        example: GAMING_CURRENCIES[0],
        enum: Object.values(GAMING_CURRENCIES),
    })
    @IsEnum(GAMING_CURRENCIES)
    gameCurrency: GamingCurrencyCode;
}
