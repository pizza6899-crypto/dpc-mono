import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ExchangeCurrencyCode } from '@repo/database';

@Exclude()
export class UserHourlyStatResponseDto {
    @Expose()
    @Transform(({ value }) => value.toString())
    @ApiProperty({ description: 'User ID', example: '12345' })
    userId: string;

    @Expose()
    @ApiProperty({ description: 'Currency code', enum: ['KRW', 'USD', 'JPY'] })
    currency: ExchangeCurrencyCode;

    @Expose()
    @ApiProperty({ description: 'Date of the hourly stat' })
    date: Date;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total deposit amount', example: 1000000 })
    totalDeposit: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total withdraw amount', example: 500000 })
    totalWithdraw: number;

    @Expose()
    @ApiProperty({ description: 'Deposit count', example: 5 })
    depositCount: number;

    @Expose()
    @ApiProperty({ description: 'Withdraw count', example: 2 })
    withdrawCount: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total bet amount', example: 2000000 })
    totalBet: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Total win amount', example: 1800000 })
    totalWin: number;

    @Expose()
    @Transform(({ value }) => value.toNumber())
    @ApiProperty({ description: 'Net win (user perspective)', example: -200000 })
    netWin: number;

    @Expose()
    @ApiProperty({ description: 'Total game count', example: 150 })
    totalGameCount: number;
}
