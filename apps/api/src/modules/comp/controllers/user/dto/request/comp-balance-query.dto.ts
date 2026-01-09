import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ExchangeCurrencyCode } from '@repo/database';

export class CompBalanceQueryDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, example: ExchangeCurrencyCode.KRW })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;
}
