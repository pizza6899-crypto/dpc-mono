import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class AdjustedBalanceDetailDto {
    @ApiProperty({ description: 'New Cash Balance / 변경 후 현금 잔액' })
    cash: string;

    @ApiProperty({ description: 'New Bonus Balance / 변경 후 보너스 잔액' })
    bonus: string;

    @ApiProperty({ description: 'New Reward Balance / 변경 후 리워드 잔액' })
    reward: string;

    @ApiProperty({ description: 'New Total Available Balance / 변경 후 총 가용 잔액' })
    total: string;
}

export class AdjustBalanceResponseDto {
    @ApiProperty({ description: 'User ID / 사용자 ID' })
    userId: string;

    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code / 통화 코드' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'New Balance Information / 변경 후 잔액 정보' })
    newBalance: AdjustedBalanceDetailDto;

    @ApiProperty({ description: 'Last Updated At / 최종 수정 일시' })
    updatedAt: Date;
}
