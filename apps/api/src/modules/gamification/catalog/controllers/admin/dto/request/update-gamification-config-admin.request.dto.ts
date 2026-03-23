import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';
import { Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';

/**
 * 게이미피케이션 정책 업데이트 요청 DTO
 */
export class UpdateGamificationConfigAdminRequestDto {
  @ApiPropertyOptional({
    description: 'XP multiplier per USD rolling / 1 USD 베팅당 획득 경험치 배율',
    example: '1.5',
  })
  @IsOptional()
  @Transform(({ value }) => new Prisma.Decimal(value))
  expGrantMultiplierUsd?: Prisma.Decimal;

  @ApiPropertyOptional({
    description: 'Stat points granted per level up / 레벨업당 지급 스탯 포인트',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  statPointGrantPerLevel?: number;

  @ApiPropertyOptional({
    description: 'Maximum cap for a single stat / 단일 스탯 최대 한도',
    example: 9999,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxStatLimit?: number;

  @ApiPropertyOptional({
    description: 'Stat reset price / 스탯 초기화 비용',
    example: '50000',
  })
  @IsOptional()
  @Transform(({ value }) => new Prisma.Decimal(value))
  statResetPrice?: Prisma.Decimal;

  @ApiPropertyOptional({
    description: 'Currency for stat reset / 스탯 초기화 통화 코드',
    enum: ExchangeCurrencyCode,
    example: 'KRW',
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  statResetCurrency?: ExchangeCurrencyCode;
}
