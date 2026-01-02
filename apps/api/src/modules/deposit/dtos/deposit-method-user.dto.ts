import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@repo/database';

// -------------------- Crypto --------------------

export class CryptoNetworkSimpleDto {
    @ApiProperty({ description: 'Network name', example: 'TRC20' })
    network: string;

    @ApiProperty({ description: 'Minimum deposit amount', example: '10' })
    minDepositAmount: string;
}

export class CryptoGroupSimpleDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency symbol (Coin)', example: 'USDT' })
    symbol: ExchangeCurrencyCode;

    @ApiProperty({ type: [CryptoNetworkSimpleDto], description: 'Supported networks' })
    networks: CryptoNetworkSimpleDto[];
}

// -------------------- Bank --------------------

export class BankGroupSimpleDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency code', example: 'KRW' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Minimum deposit amount for this currency', example: '10000' })
    minAmount: string;
}

// -------------------- Response --------------------

export class GetAvailableDepositMethodsResponseDto {
    @ApiProperty({ type: [BankGroupSimpleDto], description: 'Available bank currencies' })
    bank: BankGroupSimpleDto[];

    @ApiProperty({ type: [CryptoGroupSimpleDto], description: 'Available crypto methods' })
    crypto: CryptoGroupSimpleDto[];
}
