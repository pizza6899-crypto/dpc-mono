import { IsEnum, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from 'src/generated/prisma';

export class ClaimCompRequestDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, example: ExchangeCurrencyCode.KRW })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;

    @ApiProperty({ example: 1000 })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    @Type(() => Number)
    amount: number;
}
