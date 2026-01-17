import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from 'src/generated/prisma';

export class UserHourlyStatResponseDto {
    @ApiProperty({ description: 'Currency code', enum: ['KRW', 'USD', 'JPY'] })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Date of the hourly stat' })
    date: Date;

    @ApiProperty({ description: 'Total deposit amount', example: 1000000 })
    totalDeposit: number;

    @ApiProperty({ description: 'Total withdraw amount', example: 500000 })
    totalWithdraw: number;

    @ApiProperty({ description: 'Deposit count', example: 5 })
    depositCount: number;

    @ApiProperty({ description: 'Withdraw count', example: 2 })
    withdrawCount: number;

    @ApiProperty({ description: 'Total bet amount', example: 2000000 })
    totalBet: number;

    @ApiProperty({ description: 'Total win amount', example: 1800000 })
    totalWin: number;

    @ApiProperty({ description: 'Net win (user perspective)', example: -200000 })
    netWin: number;

    @ApiProperty({ description: 'Total game count', example: 150 })
    totalGameCount: number;

    @ApiProperty({ description: 'Total bonus given', example: 100000 })
    totalBonusGiven: number;

    @ApiProperty({ description: 'Total bonus used', example: 50000 })
    totalBonusUsed: number;

    @ApiProperty({ description: 'Total bonus converted to cash', example: 20000 })
    totalBonusConverted: number;

    @ApiProperty({ description: 'Total comp earned', example: 1000 })
    totalCompEarned: number;

    @ApiProperty({ description: 'Total comp converted to cash', example: 500 })
    totalCompConverted: number;

    @ApiProperty({ description: 'Total comp deducted by admin', example: 100 })
    totalCompDeducted: number;
}
