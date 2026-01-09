import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ExchangeCurrencyCode } from '@repo/database';

export enum AdminCompAdjustType {
    GIVE = 'GIVE',
    DEDUCT = 'DEDUCT',
}

export class AdminCompAdjustRequestDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, example: ExchangeCurrencyCode.KRW })
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;

    @ApiProperty({ example: 1000 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ enum: AdminCompAdjustType, example: AdminCompAdjustType.GIVE })
    @IsEnum(AdminCompAdjustType)
    type: AdminCompAdjustType;

    @ApiProperty({ example: 'Manual adjustment', required: false })
    @IsString()
    @IsOptional()
    reason?: string;
}
