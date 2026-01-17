import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ExchangeCurrencyCode } from 'src/generated/prisma';

export class AdminCompBalanceQueryDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, example: ExchangeCurrencyCode.KRW })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;
}
