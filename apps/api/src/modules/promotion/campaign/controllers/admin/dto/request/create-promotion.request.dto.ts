// src/modules/promotion/campaign/controllers/admin/dto/request/create-promotion.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PromotionTargetType,
  PromotionResetType,
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
    description: 'Bonus validity period (minutes) / 보너스 유효 기간 (분 단위)',
    example: 1440, // 24시간
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bonusExpiryMinutes?: number;

  @ApiPropertyOptional({
    description: 'Maximum usage count per user / 유저당 최대 사용 횟수',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({
    description: 'Periodic reset type / 참여 횟수 초기화 주기',
    enum: PromotionResetType,
    default: PromotionResetType.NONE,
  })
  @IsOptional()
  @IsEnum(PromotionResetType)
  periodicResetType?: PromotionResetType;

  @ApiPropertyOptional({
    description:
      'Applicable days (0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat) / 적용 요일 (0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토)',
    example: [6, 0],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  applicableDays?: number[];

  @ApiPropertyOptional({
    description: 'Applicable start time / 적용 시작 시간',
    example: '2024-01-01T18:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  applicableStartTime?: string;

  @ApiPropertyOptional({
    description: 'Applicable end time / 적용 종료 시간',
    example: '2024-01-01T22:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  applicableEndTime?: string;
}
