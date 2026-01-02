// src/modules/deposit/dtos/deposit-method-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@repo/database';

export class BankTransferMethodDto {
    @ApiProperty({ description: 'Configuration UID' })
    uid: string;

    @ApiProperty({ description: 'Bank name' })
    bankName: string;

    @ApiProperty({ description: 'Account holder name' })
    accountHolder: string;

    @ApiProperty({ description: 'Bank account number' })
    accountNumber: string;

    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency code' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Minimum deposit amount' })
    minAmount: string;

    @ApiProperty({ description: 'Maximum deposit amount', nullable: true })
    maxAmount: string | null;

    @ApiProperty({ description: 'User-facing description', nullable: true })
    description: string | null;

    @ApiProperty({ description: 'Internal or detail notes', nullable: true })
    notes: string | null;
}

export class CryptoMethodDto {
    @ApiProperty({ description: 'Configuration UID' })
    uid: string;

    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency symbol' })
    symbol: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Network name' })
    network: string;

    @ApiProperty({ description: 'Minimum deposit amount' })
    minDepositAmount: string;

    @ApiProperty({ description: 'Deposit fee rate' })
    depositFeeRate: string;

    @ApiProperty({ description: 'Confirmations required' })
    confirmations: number;

    @ApiProperty({ description: 'Contract address for tokens', nullable: true })
    contractAddress: string | null;
}

export class GetAvailableDepositMethodsResponseDto {
    @ApiProperty({ type: [BankTransferMethodDto], description: 'List of available bank transfer methods' })
    bankTransfer: BankTransferMethodDto[];

    @ApiProperty({ type: [CryptoMethodDto], description: 'List of available crypto deposit methods' })
    crypto: CryptoMethodDto[];
}
