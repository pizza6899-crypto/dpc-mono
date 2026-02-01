import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ClaimRewardRequestDto {
    @ApiProperty({
        description: 'Target currency for the reward / 보상을 수령할 통화 설정',
        enum: ExchangeCurrencyCode,
        example: ExchangeCurrencyCode.USD,
        default: ExchangeCurrencyCode.USD,
    })
    @IsEnum(ExchangeCurrencyCode)
    @IsOptional()
    currency?: ExchangeCurrencyCode = ExchangeCurrencyCode.USD;
}
