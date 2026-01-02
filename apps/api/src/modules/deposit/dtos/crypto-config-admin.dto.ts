// src/modules/deposit/dtos/crypto-config-admin.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, Min, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCryptoConfigRequestDto {
    @ApiProperty({ description: 'Symbol / 심볼', example: 'USDT' })
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @ApiProperty({ description: 'Network / 네트워크', example: 'ERC20' })
    @IsString()
    @IsNotEmpty()
    network: string;

    @ApiPropertyOptional({ description: 'Active Status / 활성화 여부', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ description: 'Minimum Deposit Amount / 최소 입금 금액', example: '10' })
    @IsString()
    @IsNotEmpty()
    minDepositAmount: string;

    @ApiProperty({ description: 'Deposit Fee Rate / 입금 수수료율', example: '0.01' })
    @IsString()
    @IsNotEmpty()
    depositFeeRate: string;

    @ApiProperty({ description: 'Confirmations Needed / 필요 컨펌 수', example: 12 })
    @IsInt()
    @Min(0)
    @IsNotEmpty()
    @Type(() => Number)
    confirmations: number;

    @ApiPropertyOptional({ description: 'Contract Address / 컨트랙트 주소', example: '0x...' })
    @IsString()
    @IsOptional()
    contractAddress?: string;
}

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
    @IsNumberString()
    @IsOptional()
    minDepositAmount?: string;

    @ApiPropertyOptional({ description: 'Deposit Fee Rate' })
    @IsNumberString()
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
    contractAddress?: string;
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
