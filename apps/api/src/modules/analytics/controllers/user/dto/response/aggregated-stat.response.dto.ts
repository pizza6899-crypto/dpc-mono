import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class AggregatedStatResponseDto {
    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total deposit amount', example: 5000000 })
    totalDeposit: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total withdraw amount', example: 2000000 })
    totalWithdraw: number;

    @Expose()
    @ApiProperty({ description: 'Total deposit count', example: 10 })
    depositCount: number;

    @Expose()
    @ApiProperty({ description: 'Total withdraw count', example: 5 })
    withdrawCount: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total bet amount', example: 10000000 })
    totalBet: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total win amount', example: 9500000 })
    totalWin: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Net win (user perspective)', example: -500000 })
    netWin: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Gross Gaming Revenue (operator perspective)', example: 500000 })
    ggr: number;

    @Expose()
    @ApiProperty({ description: 'Total game count', example: 500 })
    totalGameCount: number;
}
