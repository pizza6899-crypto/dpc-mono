import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class AdminAdjustCompDto {
    @ApiProperty({
        enum: ExchangeCurrencyCode,
        description: 'Currency code / 통화 코드',
    })
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;

    @ApiProperty({
        description: 'Adjustment amount (positive to add, negative to deduct) / 조정 금액',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    amount: number;

    @ApiProperty({
        description: 'Description or reason for adjustment / 조정 사유 및 설명',
        type: String,
    })
    @IsString()
    description: string;
}
