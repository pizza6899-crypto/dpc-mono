// src/modules/deposit/dtos/crypto-config-admin.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCryptoConfigRequestDto {
    @ApiPropertyOptional({ description: 'Symbol' })
    @IsString()
    @IsOptional()
    symbol?: string;

    @ApiPropertyOptional({ description: 'Network' })
    @IsString()
    @IsOptional()
    network?: string;

    @ApiPropertyOptional({ description: 'Active Status' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Minimum Deposit Amount' })
    @IsString()
    @IsOptional()
    minDepositAmount?: string;

    @ApiPropertyOptional({ description: 'Deposit Fee Rate' })
    @IsString()
    @IsOptional()
    depositFeeRate?: string;

    @ApiPropertyOptional({ description: 'Confirmations Needed' })
    @IsInt()
    @Min(0)
    @IsOptional()
    confirmations?: number;

    @ApiPropertyOptional({ description: 'Contract Address' })
    @IsString()
    @IsOptional()
    contractAddress?: string | null;
}

export class GetCryptoConfigsQueryDto {
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

    @ApiPropertyOptional({ description: 'Filter by symbol' })
    @IsString()
    @IsOptional()
    symbol?: string;

    @ApiPropertyOptional({ description: 'Filter by network' })
    @IsString()
    @IsOptional()
    network?: string;

    @ApiPropertyOptional({ description: 'Filter by active status' })
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;
}

export class CryptoConfigResponseDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: 'Business UID' })
    uid: string;

    @ApiProperty({ description: 'Symbol' })
    symbol: string;

    @ApiProperty({ description: 'Network' })
    network: string;

    @ApiProperty({ description: 'Active Status' })
    isActive: boolean;

    @ApiProperty({ description: 'Minimum Deposit Amount' })
    minDepositAmount: string;

    @ApiProperty({ description: 'Deposit Fee Rate' })
    depositFeeRate: string;

    @ApiProperty({ description: 'Confirmations Needed' })
    confirmations: number;

    @ApiPropertyOptional({ description: 'Contract Address' })
    contractAddress: string | null;

    @ApiProperty({ description: 'Created At' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated At' })
    updatedAt: Date;
}
