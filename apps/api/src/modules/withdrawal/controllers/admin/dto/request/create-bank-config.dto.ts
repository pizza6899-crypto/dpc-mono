import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateBankConfigDto {
    @ApiProperty({ enum: ExchangeCurrencyCode })
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;

    @ApiProperty({ example: 'Shinhan Bank' })
    @IsString()
    @IsNotEmpty()
    bankName: string;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({ example: '10000' })
    @IsNumberString()
    minWithdrawAmount: string;

    @ApiPropertyOptional({ example: '10000000' })
    @IsOptional()
    @IsNumberString()
    maxWithdrawAmount?: string;

    @ApiProperty({ example: '500' })
    @IsNumberString()
    withdrawFeeFixed: string;

    @ApiProperty({ example: '0.00' })
    @IsNumberString()
    withdrawFeeRate: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
