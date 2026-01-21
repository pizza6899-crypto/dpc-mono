import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateBankDepositRequestDto {
    @ApiPropertyOptional({
        description: 'Deposit promotion code (입금 프로모션 코드)',
        example: 'WELCOME_BONUS',
    })
    @IsOptional()
    @IsString()
    depositPromotionCode?: string;

    @ApiProperty({
        description: 'Currency code (입금할 통화 코드)',
        example: ExchangeCurrencyCode.KRW,
    })
    @IsNotEmpty()
    @IsString()
    payCurrency: string;

    @ApiProperty({
        description: 'Deposit amount (입금 금액)',
        example: 100000,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty({
        description: 'Depositor name (입금자명)',
        example: '김철수',
    })
    @IsNotEmpty()
    @IsString()
    depositorName: string;
}
