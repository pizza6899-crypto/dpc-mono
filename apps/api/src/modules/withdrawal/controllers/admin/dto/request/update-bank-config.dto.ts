import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateBankConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '10000' })
  @IsOptional()
  @IsNumberString()
  minWithdrawAmount?: string;

  @ApiPropertyOptional({ example: '10000000' })
  @IsOptional()
  @IsNumberString()
  maxWithdrawAmount?: string;

  @ApiPropertyOptional({ example: '500' })
  @IsOptional()
  @IsNumberString()
  withdrawFeeFixed?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  withdrawFeeRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
