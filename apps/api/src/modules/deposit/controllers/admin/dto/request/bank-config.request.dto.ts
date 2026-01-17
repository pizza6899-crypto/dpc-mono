import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { Type } from 'class-transformer';

export class CreateBankConfigRequestDto {
    @ApiProperty({
        enum: ExchangeCurrencyCode,
        description: 'Currency code / 통화 코드',
        example: ExchangeCurrencyCode.KRW,
    })
    @IsEnum(ExchangeCurrencyCode)
    @IsNotEmpty()
    currency: ExchangeCurrencyCode;

    @ApiProperty({
        description: 'Bank name / 은행명',
        example: 'Kookmin Bank',
    })
    @IsString()
    @IsNotEmpty()
    bankName: string;

    @ApiProperty({
        description: 'Account number / 계좌 번호',
        example: '123-456-7890',
    })
    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @ApiProperty({
        description: 'Account holder / 예금주',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    accountHolder: string;

    @ApiPropertyOptional({
        description: 'Activity status / 활성화 여부',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Priority / 우선순위 (높을수록 상단 노출)',
        default: 0,
    })
    @IsNumber()
    @IsOptional()
    priority?: number;

    @ApiPropertyOptional({
        description: 'Description / 설명',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Notes / 비고',
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({
        description: 'Minimum deposit amount / 최소 입금 금액',
        example: '10000',
    })
    @IsString()
    @IsNotEmpty()
    minAmount: string;

    @ApiPropertyOptional({
        description: 'Maximum deposit amount / 최대 입금 금액',
        example: '1000000',
    })
    @IsString()
    @IsOptional()
    maxAmount?: string;
}

export class UpdateBankConfigRequestDto {
    @ApiPropertyOptional({ enum: ExchangeCurrencyCode, description: 'Currency code / 통화 코드' })
    @IsEnum(ExchangeCurrencyCode)
    @IsOptional()
    currency?: ExchangeCurrencyCode;

    @ApiPropertyOptional({ description: 'Bank name / 은행명', example: 'Kookmin Bank' })
    @IsString()
    @IsOptional()
    bankName?: string;

    @ApiPropertyOptional({ description: 'Account number / 계좌 번호', example: '123-456-7890' })
    @IsString()
    @IsOptional()
    accountNumber?: string;

    @ApiPropertyOptional({ description: 'Account holder / 예금주', example: 'John Doe' })
    @IsString()
    @IsOptional()
    accountHolder?: string;

    @ApiPropertyOptional({ description: 'Activity status / 활성화 여부' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Priority / 우선순위 (높을수록 상단 노출)', example: 10 })
    @IsNumber()
    @IsOptional()
    priority?: number;

    @ApiPropertyOptional({ description: 'Description / 설명' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Notes / 비고' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ description: 'Minimum deposit amount / 최소 입금 금액', example: '10000' })
    @IsString()
    @IsOptional()
    minAmount?: string;

    @ApiPropertyOptional({ description: 'Maximum deposit amount / 최대 입금 금액', example: '1000000' })
    @IsString()
    @IsOptional()
    maxAmount?: string;
}

export class GetBankConfigsQueryDto {
    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ description: 'Limit per page', default: 20 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({ description: 'Sort by field', default: 'createdAt' })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
    @IsEnum(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({ enum: ExchangeCurrencyCode, description: 'Filter by currency' })
    @IsEnum(ExchangeCurrencyCode)
    @IsOptional()
    currency?: ExchangeCurrencyCode;

    @ApiPropertyOptional({ description: 'Filter by active status' })
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;
}
