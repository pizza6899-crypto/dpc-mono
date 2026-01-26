import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';

export class CompBalanceQueryDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency code / 통화 코드', example: ExchangeCurrencyCode.KRW })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;
}
