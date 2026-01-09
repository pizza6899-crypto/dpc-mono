import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';

export class ClaimCompRequestDto {
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;

    @IsNumber()
    @IsPositive()
    @Type(() => Number) // Handle number conversion if JSON sends number
    // Or handle string-to-decimal if we want high precision from client
    amount: number;
}
