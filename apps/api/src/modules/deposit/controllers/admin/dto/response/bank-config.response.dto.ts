import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@repo/database';

export class BankConfigResponseDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: 'Business UID' })
    uid: string;

    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Bank Name' })
    bankName: string;

    @ApiProperty({ description: 'Account Number' })
    accountNumber: string;

    @ApiProperty({ description: 'Account Holder' })
    accountHolder: string;

    @ApiProperty({ description: 'Active Status' })
    isActive: boolean;

    @ApiProperty({ description: 'Priority' })
    priority: number;

    @ApiPropertyOptional({ description: 'Description' })
    description: string | null;

    @ApiPropertyOptional({ description: 'Notes' })
    notes: string | null;

    @ApiProperty({ description: 'Minimum Amount' })
    minAmount: string;

    @ApiPropertyOptional({ description: 'Maximum Amount' })
    maxAmount: string | null;

    @ApiPropertyOptional({ description: 'Total Deposits count' })
    totalDeposits: number;

    @ApiProperty({ description: 'Total Deposit Amount' })
    totalDepositAmount: string;

    @ApiProperty({ description: 'Created At' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated At' })
    updatedAt: Date;
}
