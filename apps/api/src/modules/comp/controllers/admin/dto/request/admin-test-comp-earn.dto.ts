import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class AdminTestCompEarnDto {
    @ApiProperty({
        description: 'User ID / 사용자 ID',
        example: '1',
    })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({
        description: 'Amount to earn / 적립할 금액',
        example: '1000.50',
    })
    @IsNotEmpty()
    @IsString()
    amount: string;

    @ApiProperty({
        enum: ExchangeCurrencyCode,
        description: 'Currency code / 통화 코드',
        example: ExchangeCurrencyCode.KRW,
    })
    @IsNotEmpty()
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;
}
