import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FindBankConfigsRequestDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bankName?: string;

    @ApiPropertyOptional({ enum: ExchangeCurrencyCode })
    @IsOptional()
    @IsEnum(ExchangeCurrencyCode)
    currency?: ExchangeCurrencyCode;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive?: boolean;
}
