import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateMyCurrencyRequestDto {
    @ApiPropertyOptional({
        description: 'Primary Currency / 대표 통화',
        enum: ExchangeCurrencyCode,
        example: ExchangeCurrencyCode.USD,
    })
    @IsOptional()
    @IsEnum(ExchangeCurrencyCode)
    primaryCurrency?: ExchangeCurrencyCode;

    @ApiPropertyOptional({
        description: 'Play Currency / 플레이 통화',
        enum: ExchangeCurrencyCode,
        example: ExchangeCurrencyCode.KRW,
    })
    @IsOptional()
    @IsEnum(ExchangeCurrencyCode)
    playCurrency?: ExchangeCurrencyCode;
}
