// src/modules/promotion/controllers/admin/dto/request/create-promotion.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  IsNumberString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PromotionQualification,
  PromotionTargetType,
  PromotionBonusType,
  ExchangeCurrencyCode,
  Language,
} from '@repo/database';
import { Transform } from 'class-transformer';

export class CurrencySettingDto {
  @ApiProperty({
    description: '통화 코드',
    example: ExchangeCurrencyCode.USDT,
    enum: ExchangeCurrencyCode,
  })
  @IsNotEmpty()
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '최소 입금 금액',
    example: '10.00',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  minDepositAmount: string;

  @ApiPropertyOptional({
    description: '최대 보너스 금액',
    example: '1000.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  maxBonusAmount?: string;

  @ApiPropertyOptional({
    description: '최대 출금 금액',
    example: '5000.00',
    type: String,
  })
  @IsOptional()
  @IsString()
  maxWithdrawAmount?: string;
}

export class TranslationDto {
  @ApiProperty({
    description: '언어 코드',
    example: Language.KO,
    enum: Language,
  })
  @IsNotEmpty()
  @IsEnum(Language)
  language: Language;

  @ApiProperty({
    description: '프로모션 이름',
    example: '첫 충전 100% 보너스',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '프로모션 설명',
    example: '첫 충전 시 100% 보너스를 받으세요!',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class CreatePromotionRequestDto {
  @ApiProperty({
    description: '관리용 프로모션 이름',
    example: '첫 충전 100% 보너스',
  })
  @IsNotEmpty()
  @IsString()
  managementName: string;

  @ApiPropertyOptional({
    description: '활성화 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: '유저 노출용 프로모션 코드',
    example: 'WELCOME_BONUS',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

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

  @ApiPropertyOptional({
    description: '타겟 유저 ID 목록 (targetType이 SPECIFIC_USERS인 경우 필수)',
    example: ['1', '2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => BigInt(v)) : value))
  targetUserIds?: bigint[];

  @ApiProperty({
    description: '보너스 타입',
    example: PromotionBonusType.PERCENTAGE,
    enum: PromotionBonusType,
  })
  @IsNotEmpty()
  @IsEnum(PromotionBonusType)
  bonusType: PromotionBonusType;

  @ApiPropertyOptional({
    description: '보너스 비율 (PERCENTAGE 타입인 경우)',
    example: '1.0',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  bonusRate?: string;

  @ApiPropertyOptional({
    description: '롤링 배수',
    example: '20.0',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  rollingMultiplier?: string;

  @ApiProperty({
    description: '자격 유지 조건',
    example: PromotionQualification.FORFEIT_BONUS_ON_WITHDRAWAL,
    enum: PromotionQualification,
  })
  @IsNotEmpty()
  @IsEnum(PromotionQualification)
  qualificationMaintainCondition: PromotionQualification;

  @ApiPropertyOptional({
    description: '1회성 프로모션 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional({
    description: '입금 필수 여부',
    example: true,
    default: true,
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

