import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateCryptoConfigDto {
    @ApiProperty({ example: 'USDT' })
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @ApiProperty({ example: 'TRC20' })
    @IsString()
    @IsNotEmpty()
    network: string;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({ example: '10.00' })
    @IsNumberString()
    minWithdrawAmount: string;

    @ApiPropertyOptional({ example: '10000.00' })
    @IsOptional()
    @IsNumberString()
    maxWithdrawAmount?: string;

    @ApiPropertyOptional({ example: '1000.00' })
    @IsOptional()
    @IsNumberString()
    autoProcessLimit?: string;

    @ApiProperty({ example: '1.00' })
    @IsNumberString()
    withdrawFeeFixed: string;

    @ApiProperty({ example: '0.00' })
    @IsNumberString()
    withdrawFeeRate: string;
}
