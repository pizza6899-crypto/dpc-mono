import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@repo/database';
import { UserHourlyStat } from 'src/modules/analytics/domain/model/user-hourly-stat.entity';

export class AdminStatResponseDto {
    @ApiProperty({ description: 'User ID', example: '12345' })
    userId: string;

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

    @ApiProperty({ description: 'Gross Gaming Revenue', example: 200000 })
    ggr: number;

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

    @ApiProperty({ description: 'Start balance at the hour', example: 1000000 })
    startBalance: number;

    @ApiProperty({ description: 'End balance at the hour', example: 1200000 })
    endBalance: number;

    static fromDomain(stat: UserHourlyStat): AdminStatResponseDto {
        const dto = new AdminStatResponseDto();
        dto.userId = stat.userId.toString();
        dto.currency = stat.currency;
        dto.date = stat.date;
        dto.totalDeposit = stat.totalDeposit.toNumber();
        dto.totalWithdraw = stat.totalWithdraw.toNumber();
        dto.depositCount = stat.depositCount;
        dto.withdrawCount = stat.withdrawCount;
        dto.totalBet = stat.totalBet.toNumber();
        dto.totalWin = stat.totalWin.toNumber();
        dto.netWin = stat.netWin.toNumber();
        dto.ggr = stat.ggr.toNumber();
        dto.totalGameCount = stat.totalGameCount;
        dto.totalBonusGiven = stat.totalBonusGiven.toNumber();
        dto.totalBonusUsed = stat.totalBonusUsed.toNumber();
        dto.totalBonusConverted = stat.totalBonusConverted.toNumber();
        dto.totalCompEarned = stat.totalCompEarned.toNumber();
        dto.totalCompConverted = stat.totalCompConverted.toNumber();
        dto.totalCompDeducted = stat.totalCompDeducted.toNumber();
        dto.startBalance = stat.startBalance.toNumber();
        dto.endBalance = stat.endBalance.toNumber();
        return dto;
    }
}
