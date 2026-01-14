import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumberString } from 'class-validator';
import { ExchangeCurrencyCode } from '@repo/database';

export class VerifyPromotionCodeRequestDto {
    @ApiProperty({
        description: '프로모션 코드',
        example: 'WELCOME_BONUS',
    })
    @IsNotEmpty()
    @IsString()
    code: string;

    @ApiProperty({
        description: '입금 예정 금액',
        example: '100.00',
        type: String,
    })
    @IsNotEmpty()
    @IsNumberString()
    depositAmount: string;

    @ApiProperty({
        description: '통화 코드',
        example: ExchangeCurrencyCode.USDT,
        enum: ExchangeCurrencyCode,
    })
    @IsNotEmpty()
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;
}
