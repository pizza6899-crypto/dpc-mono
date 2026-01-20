import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WALLET_CURRENCIES, type WalletCurrencyCode } from 'src/utils/currency.util';
import { GAMING_CURRENCIES, type GamingCurrencyCode } from 'src/utils/currency.util';

export class LaunchGameRequestDto {
    @ApiProperty({ description: 'Encoded game ID (Sqids)' })
    @IsString()
    @IsNotEmpty()
    gameId: string;

    @ApiProperty({ description: 'Is mobile device' })
    @IsBoolean()
    isMobile: boolean;

    @ApiProperty({ description: 'Wallet currency', enum: WALLET_CURRENCIES })
    @IsEnum(WALLET_CURRENCIES)
    walletCurrency: WalletCurrencyCode;

    @ApiProperty({ description: 'Game currency', enum: GAMING_CURRENCIES })
    @IsEnum(GAMING_CURRENCIES)
    gameCurrency: GamingCurrencyCode;
}
