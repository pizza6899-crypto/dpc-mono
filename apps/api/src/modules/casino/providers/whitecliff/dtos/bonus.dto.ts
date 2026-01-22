import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { WhitecliffTransactionBaseDto } from './base.dto';

/**
 * Bonus Payout Request
 * For WHITECLIFF to notify integrators that an In Game Bonus, Promotion or Jackpot has occurred.
 */
export class BonusRequestDto extends WhitecliffTransactionBaseDto {
  @ApiProperty({
    description: 'Bonus type (0=In Game Bonus, 1=Promotion, 2=Jackpot)',
    example: 0,
  })
  @IsNumber()
  @Type(() => Number)
  type: number;

  @ApiPropertyOptional({
    description: 'Game ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  game_id?: number;

  @ApiPropertyOptional({
    description: 'Round ID',
    example: 'round123',
  })
  @IsOptional()
  @IsString()
  round_id?: string;

  @ApiPropertyOptional({
    description: 'Promotion Reference ID (Optional)',
    example: 'fs123',
  })
  @IsOptional()
  @IsString()
  freespin_id?: string;

  @ApiPropertyOptional({
    description: 'Is End Round (Optional)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_endround?: boolean;
}

/**
 * Bonus Payout Response
 */
export class BonusResponseDto {
  @ApiProperty({
    description: 'Status (0=error, 1=success)',
    example: 1,
  })
  status: number;

  @ApiProperty({
    description: 'Latest balance after bonus payout',
    example: 1000.0,
  })
  balance: number;

  @ApiPropertyOptional({
    description: 'Error message if failed',
    example: 'INVALID_USER',
  })
  @IsOptional()
  @IsString()
  error?: string;
}
