import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from 'src/generated/prisma';

export class CompBalanceResponseDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency code' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Current balance', example: '1000.50' })
    balance: string;

    @ApiProperty({ description: 'Total earned comp points', example: '5000.00' })
    totalEarned: string;

    @ApiProperty({ description: 'Total used comp points', example: '2000.00' })
    totalUsed: string;
}
