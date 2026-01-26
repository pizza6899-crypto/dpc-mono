import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString, IsIn } from 'class-validator';
import { ExchangeCurrencyCode, UserWalletTransactionType } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/http/types/pagination.types';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

export class AdminTransactionQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'User ID / 사용자 ID', example: '1' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ enum: WALLET_CURRENCIES, description: 'Currency Code / 통화 코드' })
    @IsOptional()
    @IsIn(WALLET_CURRENCIES, {
        message: 'Invalid currency code. Allowed values: ' + WALLET_CURRENCIES.join(', '),
    })
    currency?: ExchangeCurrencyCode;

    @ApiPropertyOptional({ enum: UserWalletTransactionType, description: 'Transaction Type / 트랜잭션 타입' })
    @IsOptional()
    @IsEnum(UserWalletTransactionType)
    type?: UserWalletTransactionType;

    @ApiPropertyOptional({ description: 'Start Date (ISO 8601) / 조회 시작일' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'End Date (ISO 8601) / 조회 종료일' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
