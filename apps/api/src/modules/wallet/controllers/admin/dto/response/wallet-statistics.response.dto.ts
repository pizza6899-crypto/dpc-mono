import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class CurrencyStatisticsDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code / 통화 코드' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Total Cash Balance / 총 현금 잔액 합계' })
    totalCash: string;

    @ApiProperty({ description: 'Total Bonus Balance / 총 보너스 잔액 합계' })
    totalBonus: string;



    @ApiProperty({ description: 'Total Locked Balance / 총 잠긴 잔액 합계' })
    totalLock: string;

    @ApiProperty({ description: 'Total Vault Balance / 총 금고 잔액 합계' })
    totalVault: string;

    @ApiProperty({ description: 'Total Number of Users / 해당 통화 보유 사용자 수' })
    userCount: number;
}

export class WalletStatisticsResponseDto {
    @ApiProperty({ type: [CurrencyStatisticsDto] })
    statistics: CurrencyStatisticsDto[];
}
