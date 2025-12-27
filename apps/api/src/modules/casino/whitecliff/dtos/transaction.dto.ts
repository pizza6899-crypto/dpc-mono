import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DebitRequestDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: '차감할 금액' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: '제품 ID' })
  @IsOptional()
  @IsNumber()
  prd_id: number;

  @ApiProperty({ description: '트랜잭션 ID' })
  @IsString()
  txn_id: string;

  @ApiPropertyOptional({ description: '라운드 ID' })
  @IsOptional()
  @IsString()
  round_id?: string;

  @ApiPropertyOptional({ description: '게임 ID' })
  @IsOptional()
  @IsNumber()
  game_id: number;

  @ApiPropertyOptional({ description: '테이블 ID' })
  @IsOptional()
  @IsString()
  table_id?: string;

  @ApiPropertyOptional({ description: '크레딧 금액 (특정 게임사 전용)' })
  @IsOptional()
  @IsNumber()
  credit_amount?: number;

  @ApiPropertyOptional({ description: '차감 시간' })
  @IsDateString()
  debit_time: string;

  @ApiPropertyOptional({ description: '세션 ID' })
  @IsOptional()
  @IsString()
  sid?: string;

  @ApiPropertyOptional({ description: '배당률' })
  @IsOptional()
  @IsString()
  odds?: string;

  @ApiPropertyOptional({ description: '파레이 베팅 여부' })
  @IsOptional()
  @IsNumber()
  is_parlay?: number;

  @ApiPropertyOptional({ description: '설명' })
  @IsOptional()
  desc?: any;
}

export class CreditRequestDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: '추가할 금액' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: '제품 ID' })
  @IsNumber()
  prd_id: number;

  @ApiProperty({ description: '트랜잭션 ID' })
  @IsString()
  txn_id: string;

  @ApiPropertyOptional({ description: '라운드 ID' })
  @IsOptional()
  @IsString()
  round_id?: string;

  @ApiPropertyOptional({ description: '취소 여부' })
  @IsOptional()
  @IsNumber()
  is_cancel?: number;

  @ApiPropertyOptional({ description: '크레딧 시간' })
  @IsOptional()
  @IsDateString()
  credit_time?: string;

  @ApiPropertyOptional({ description: '게임 ID' })
  @IsNumber()
  game_id: number;

  @ApiPropertyOptional({ description: '테이블 ID' })
  @IsOptional()
  @IsString()
  table_id?: string;

  @ApiPropertyOptional({ description: '세션 ID' })
  @IsOptional()
  @IsString()
  sid?: string;

  @ApiPropertyOptional({ description: '설명' })
  @IsOptional()
  desc?: any;
}

export class TransactionResponseDto {
  status: number;
  balance: number;
  error?: string;
}
