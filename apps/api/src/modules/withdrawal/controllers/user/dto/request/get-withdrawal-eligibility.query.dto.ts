import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';

export class GetWithdrawalEligibilityQueryDto {
    @ApiProperty({ description: 'Currency / 통화 (생략 시 기본 통화)', enum: ExchangeCurrencyCode, required: false })
    @IsEnum(ExchangeCurrencyCode)
    @IsOptional()
    currency?: ExchangeCurrencyCode;
}
