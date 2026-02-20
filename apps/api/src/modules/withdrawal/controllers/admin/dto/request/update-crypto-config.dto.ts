import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumberString, IsOptional } from 'class-validator';

export class UpdateCryptoConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '10.00' })
  @IsOptional()
  @IsNumberString()
  minWithdrawAmount?: string;

  @ApiPropertyOptional({ example: '10000.00' })
  @IsOptional()
  @IsNumberString()
  maxWithdrawAmount?: string;

  @ApiPropertyOptional({ example: '1000.00' })
  @IsOptional()
  @IsNumberString()
  autoProcessLimit?: string;

  @ApiPropertyOptional({ example: '1.00' })
  @IsOptional()
  @IsNumberString()
  withdrawFeeFixed?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  withdrawFeeRate?: string;
}
