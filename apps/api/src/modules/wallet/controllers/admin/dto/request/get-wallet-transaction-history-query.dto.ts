import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsInt, Min, IsIn } from 'class-validator';
import { ExchangeCurrencyCode, TransactionType } from '@repo/database';
import { Type } from 'class-transformer';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

export class GetWalletTransactionHistoryQueryDto {
    @ApiPropertyOptional({
        description: '통화 코드',
        enum: WALLET_CURRENCIES,
    })
    @IsOptional()
    @IsIn(WALLET_CURRENCIES, {
        message: 'Invalid currency code. Allowed values: ' + WALLET_CURRENCIES.join(', '),
    })
    currency?: ExchangeCurrencyCode;

    @ApiPropertyOptional({
        description: '트랜잭션 타입',
        enum: TransactionType,
    })
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @ApiPropertyOptional({
        description: '조회 시작일 (ISO 8601)',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: '조회 종료일 (ISO 8601)',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: '페이지 번호 (기본값: 1)',
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: '페이지 크기 (기본값: 20)',
        minimum: 1,
        default: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}
