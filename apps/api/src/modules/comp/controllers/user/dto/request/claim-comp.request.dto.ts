import { IsEnum, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class ClaimCompRequestDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency code / 통화 코드', example: ExchangeCurrencyCode.KRW })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Amount to claim / 전환할 금액', example: 1000 })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    @Type(() => Number)
    amount: number;
}
