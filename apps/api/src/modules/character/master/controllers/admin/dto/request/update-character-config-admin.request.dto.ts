import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsObject,
  IsPositive,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';

/**
 * 게이미피케이션 정책 업데이트 요청 DTO
 */
export class UpdateCharacterConfigAdminRequestDto {
  @ApiPropertyOptional({
    description: 'XP multiplier per USD rolling / 1 USD 베팅당 획득 경험치 배율',
    example: '1.5',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Prisma.Decimal(value) : undefined))
  xpGrantMultiplierUsd?: Prisma.Decimal;

  @ApiPropertyOptional({
    description: 'Stat points granted per level up / 레벨업당 지급 스탯 포인트',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  statPointsGrantPerLevel?: number;

  @ApiPropertyOptional({
    description: 'Maximum cap for a single stat / 단일 스탯 최대 한도',
    example: 9999,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxStatLimit?: number;

  @ApiPropertyOptional({
    description: 'Fixed prices for stat reset per currency / 통화별 스탯 초기화 고정 가격표',
    example: { KRW: 10000, USD: 10, JPY: 1500 },
  })
  @IsOptional()
  @IsObject()
  statResetPrices?: Record<string, number>;
}
