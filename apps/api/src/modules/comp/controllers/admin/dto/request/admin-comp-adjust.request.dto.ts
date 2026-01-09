import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ExchangeCurrencyCode } from '@repo/database';

export enum AdminCompAdjustType {
    GIVE = 'GIVE',
    DEDUCT = 'DEDUCT',
}

export class AdminCompAdjustRequestDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, example: ExchangeCurrencyCode.KRW })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;

    @ApiProperty({ example: 1000 })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    @Type(() => Number)
    amount: number;

    @ApiProperty({ enum: AdminCompAdjustType, example: AdminCompAdjustType.GIVE })
    @IsEnum(AdminCompAdjustType)
    @IsNotEmpty()
    type: AdminCompAdjustType;

    @ApiProperty({ example: 'Manual adjustment', required: false })
    @IsString()
    @IsOptional()
    reason?: string;
}
