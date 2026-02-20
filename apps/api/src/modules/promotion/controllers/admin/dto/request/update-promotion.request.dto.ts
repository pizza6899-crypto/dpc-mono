import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { PromotionBonusType, PromotionTargetType } from '@prisma/client';

export class UpdatePromotionRequestDto {
  @ApiPropertyOptional({
    description: '관리용 프로모션 이름',
    example: '첫 충전 100% 보너스',
  })
  @IsOptional()
  @IsString()
  managementName?: string;

  @ApiPropertyOptional({
    description: '활성화 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '프로모션 코드',
    example: 'WELCOME_BONUS',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: '프로모션 타겟 타입',
    example: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
    enum: PromotionTargetType,
  })
  @IsOptional()
  @IsEnum(PromotionTargetType)
  targetType?: PromotionTargetType;

  @ApiPropertyOptional({
    description: '보너스 타입',
    example: PromotionBonusType.PERCENTAGE,
    enum: PromotionBonusType,
  })
  @IsOptional()
  @IsEnum(PromotionBonusType)
  bonusType?: PromotionBonusType;

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

  @ApiPropertyOptional({
    description: '보너스 비율',
    example: '1.0',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  bonusRate?: string | null;

  @ApiPropertyOptional({
    description: '롤링 배수',
    example: '20.0',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  rollingMultiplier?: string | null;

  @ApiPropertyOptional({
    description: '1회성 프로모션 여부',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional({
    description: '입금 필수 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDepositRequired?: boolean;

  @ApiPropertyOptional({
    description: '최대 사용 횟수 (선착순)',
    example: 100,
    type: Number,
  })
  @IsOptional()
  maxUsageCount?: number | null;

  @ApiPropertyOptional({
    description: '보너스 유효 기간 (분 단위)',
    example: 1440,
    type: Number,
  })
  @IsOptional()
  bonusExpiryMinutes?: number | null;
}
