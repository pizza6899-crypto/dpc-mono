// src/modules/promotion/controllers/admin/dto/request/create-promotion.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PromotionTargetType,
  PromotionBonusType,
} from '@prisma/client';

export class CreatePromotionRequestDto {
  @ApiPropertyOptional({
    description: '활성화 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '프로모션 시작일',
    example: '2024-01-01T00:00:00Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({
    description: '프로모션 종료일',
    example: '2024-12-31T23:59:59Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiProperty({
    description: '프로모션 타겟 타입',
    example: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
    enum: PromotionTargetType,
  })
  @IsNotEmpty()
  @IsEnum(PromotionTargetType)
  targetType: PromotionTargetType;

  @ApiProperty({
    description: '보너스 타입',
    example: PromotionBonusType.PERCENTAGE,
    enum: PromotionBonusType,
  })
  @IsNotEmpty()
  @IsEnum(PromotionBonusType)
  bonusType: PromotionBonusType;

  @ApiPropertyOptional({
    description: '최대 사용 횟수 (선착순)',
    example: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsageCount?: number;

  @ApiPropertyOptional({
    description: '보너스 유효 기간 (분 단위)',
    example: 1440, // 24시간
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bonusExpiryMinutes?: number;
}
