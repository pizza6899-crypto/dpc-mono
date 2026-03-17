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
} from '@prisma/client';

export class CreatePromotionRequestDto {
  @ApiPropertyOptional({
    description: 'Whether the promotion is active / 활성화 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Promotion start date / 프로모션 시작일',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({
    description: 'Promotion end date / 프로모션 종료일',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiProperty({
    description: 'Promotion target type / 프로모션 타겟 타입',
    enum: PromotionTargetType,
  })
  @IsNotEmpty()
  @IsEnum(PromotionTargetType)
  targetType: PromotionTargetType;


  @ApiPropertyOptional({
    description: 'Maximum usage count (FCFS) / 최대 사용 횟수 (선착순)',
    example: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsageCount?: number;

  @ApiPropertyOptional({
    description: 'Bonus validity period (minutes) / 보너스 유효 기간 (분 단위)',
    example: 1440, // 24시간
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bonusExpiryMinutes?: number;
}
