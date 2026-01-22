import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { WhitecliffTransactionBaseDto } from './base.dto';

// Debit Request
export class DebitRequestDto extends WhitecliffTransactionBaseDto {
  @ApiPropertyOptional({
    description: 'Debit Time (datetime)',
    example: '2024-01-01 12:00:00',
  })
  @IsOptional()
  @IsString()
  debit_time?: string;

  @ApiPropertyOptional({
    description: 'Game ID',
    example: 12345,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  game_id?: number;

  @ApiPropertyOptional({
    description: 'Round ID (unique round id)',
    example: 'round123',
  })
  @IsOptional()
  @IsString()
  round_id?: string;

  @ApiPropertyOptional({
    description: 'Table ID (Only applicable for Evolution)',
    example: 'baccarat10001',
  })
  @IsOptional()
  @IsString()
  table_id?: string;

  @ApiPropertyOptional({
    description: 'Credit Amount (Payout amount generated during a Debit request)',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  credit_amount?: number;

  @ApiPropertyOptional({
    description: 'Description object',
    example: { details: 'Betting details' },
  })
  @IsOptional()
  @IsObject()
  desc?: any;
}

// Credit Request
export class CreditRequestDto extends WhitecliffTransactionBaseDto {
  @ApiPropertyOptional({
    description: 'Credit Time (datetime)',
    example: '2024-01-01 12:05:00',
  })
  @IsOptional()
  @IsString()
  credit_time?: string;

  @ApiPropertyOptional({
    description: 'Game ID',
    example: 12345,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  game_id?: number;

  @ApiPropertyOptional({
    description: 'Round ID (unique round id)',
    example: 'round123',
  })
  @IsOptional()
  @IsString()
  round_id?: string;

  @ApiPropertyOptional({
    description: 'Table ID (Only applicable for Evolution)',
    example: 'baccarat10001',
  })
  @IsOptional()
  @IsString()
  table_id?: string;

  @ApiPropertyOptional({
    description: 'Is Cancel (1=cancel, 0=normal)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  is_cancel?: number;

  @ApiPropertyOptional({
    description: 'Description object',
  })
  @IsOptional()
  @IsObject()
  desc?: any;
}

// Transaction Response (Common for Debit/Credit)
export class TransactionResponseDto {
  @ApiProperty({
    description: 'Status (0=error, 1=success)',
    example: 1,
  })
  status: number;

  @ApiProperty({
    description: 'Latest balance',
    example: 10000.0,
  })
  balance: number;

  @ApiProperty({
    description: 'Error message if failed',
    required: false,
    example: 'INSUFFICIENT_FUNDS',
  })
  error?: string;
}
