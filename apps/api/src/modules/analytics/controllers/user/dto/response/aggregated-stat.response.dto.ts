import { ApiProperty } from '@nestjs/swagger';

export class AggregatedStatResponseDto {
    @ApiProperty({ description: 'Total deposit amount', example: 5000000 })
    totalDeposit: number;

    @ApiProperty({ description: 'Total withdraw amount', example: 2000000 })
    totalWithdraw: number;

    @ApiProperty({ description: 'Total deposit count', example: 10 })
    depositCount: number;

    @ApiProperty({ description: 'Total withdraw count', example: 5 })
    withdrawCount: number;

    @ApiProperty({ description: 'Total bet amount', example: 10000000 })
    totalBet: number;

    @ApiProperty({ description: 'Total win amount', example: 9500000 })
    totalWin: number;

    @ApiProperty({ description: 'Net win (user perspective)', example: -500000 })
    netWin: number;

    @ApiProperty({ description: 'Gross Gaming Revenue (operator perspective)', example: 500000 })
    ggr: number;

    @ApiProperty({ description: 'Total game count', example: 500 })
    totalGameCount: number;

    @ApiProperty({ description: 'Total bonus given', example: 500000 })
    totalBonusGiven: number;

    @ApiProperty({ description: 'Total bonus used', example: 300000 })
    totalBonusUsed: number;

    @ApiProperty({ description: 'Total bonus converted to cash', example: 100000 })
    totalBonusConverted: number;

    @ApiProperty({ description: 'Total comp earned', example: 5000 })
    totalCompEarned: number;

    @ApiProperty({ description: 'Total comp converted to cash', example: 2000 })
    totalCompConverted: number;

    @ApiProperty({ description: 'Total comp deducted by admin', example: 500 })
    totalCompDeducted: number;
}
