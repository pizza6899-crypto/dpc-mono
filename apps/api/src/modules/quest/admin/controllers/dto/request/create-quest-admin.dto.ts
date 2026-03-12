import { QuestType, QuestCategory, ResetCycle, RewardType, ExchangeCurrencyCode, Language } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';

export class QuestMetadataDto {
  @ApiProperty({ description: 'Is hot quest / 인기 퀘스트 여부', required: false })
  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @ApiProperty({ description: 'Is new quest / 신규 퀘스트 여부', required: false })
  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @ApiProperty({ description: 'Icon file ID / 아이콘 파일 ID', required: false })
  @IsString()
  @IsOptional()
  iconFileId?: string;

  @ApiProperty({ description: 'Icon URL / 아이콘 URL', required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({ description: 'Display order / 정렬 순서', required: false })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}

export class QuestEntryRuleDto {
  @ApiProperty({ description: 'Require no withdrawal history / 출금 내역 없어야 함', required: false })
  @IsBoolean()
  @IsOptional()
  requireNoWithdrawal?: boolean;
}

export class QuestMatchRuleDto {
  // 현재 정의된 필드 없음. 필요 시 추가.
}

export class QuestRewardValueDto {
  @ApiProperty({ description: 'Reward amount / 보상 금액', required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ description: 'Reward point / 지급 포인트', required: false })
  @IsNumber()
  @IsOptional()
  point?: number;

  @ApiProperty({ description: 'Badge ID / 배지 ID', required: false })
  @IsString()
  @IsOptional()
  badgeId?: string;

  @ApiProperty({ description: 'Coupon ID / 쿠폰 ID', required: false })
  @IsString()
  @IsOptional()
  couponId?: string;
}

export class QuestGoalDto {
  @ApiProperty({
    description: 'Currency code / 통화 코드',
    enum: ExchangeCurrencyCode,
    required: false,
  })
  @IsEnum(ExchangeCurrencyCode)
  @IsOptional()
  currency?: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Target amount / 목표 금액',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @ApiProperty({
    description: 'Target count / 목표 횟수',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  targetCount?: number;

  @ApiProperty({
    description: 'Match rule settings / 실적 판칙 규칙 설정',
    type: QuestMatchRuleDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => QuestMatchRuleDto)
  @IsOptional()
  matchRule?: QuestMatchRuleDto;
}

export class QuestRewardDto {
  @ApiProperty({
    description: 'Reward type / 보상 유형',
    enum: RewardType,
  })
  @IsEnum(RewardType)
  type: RewardType;

  @ApiProperty({
    description: 'Currency code / 통화 코드',
    enum: ExchangeCurrencyCode,
    required: false,
  })
  @IsEnum(ExchangeCurrencyCode)
  @IsOptional()
  currency?: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Reward value/settings / 보상 가치/설정',
    type: QuestRewardValueDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => QuestRewardValueDto)
  @IsOptional()
  value?: QuestRewardValueDto;

  @ApiProperty({
    description: 'Expiration days / 보상 유효 기간 (일)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  expireDays?: number;

  @ApiProperty({
    description: 'Wagering multiplier / 롤링 배수',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  wageringMultiplier?: number;
}

export class QuestTranslationDto {
  @ApiProperty({
    description: 'Language code / 언어 코드',
    enum: Language,
  })
  @IsEnum(Language)
  language: Language;

  @ApiProperty({
    description: 'Quest title / 퀘스트 제목',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Quest description / 퀘스트 설명',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateQuestAdminDto {
  @ApiProperty({
    description: 'Quest type / 퀘스트 유형',
    enum: QuestType,
  })
  @IsEnum(QuestType)
  type: QuestType;

  @ApiProperty({
    description: 'Quest category / 퀘스트 카테고리',
    enum: QuestCategory,
  })
  @IsEnum(QuestCategory)
  category: QuestCategory;

  @ApiProperty({
    description: 'Reset cycle / 초기화 주기',
    enum: ResetCycle,
    required: false,
  })
  @IsEnum(ResetCycle)
  @IsOptional()
  resetCycle?: ResetCycle;

  @ApiProperty({
    description: 'Max participation attempts / 최대 참여 가능 횟수',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  maxAttempts?: number;

  @ApiProperty({
    description: 'Is quest active / 활성화 여부',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Parent quest ID (for sub-quests) / 상위 퀘스트 ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Preceding quest ID / 선행 퀘스트 ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  precedingId?: string;

  @ApiProperty({
    description: 'Quest metadata/styling / 퀘스트 메타데이터',
    type: QuestMetadataDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => QuestMetadataDto)
  @IsOptional()
  metadata?: QuestMetadataDto;

  @ApiProperty({
    description: 'Entry rule settings / 참여 자격 규칙',
    type: QuestEntryRuleDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => QuestEntryRuleDto)
  @IsOptional()
  entryRule?: QuestEntryRuleDto;

  @ApiProperty({
    description: 'Quest start time / 시작 일시',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    description: 'Quest end time / 종료 일시',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({
    description: 'Translations / 다국어 정보',
    type: [QuestTranslationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestTranslationDto)
  translations: QuestTranslationDto[];

  @ApiProperty({
    description: 'Quest goals / 목표 조건 일람',
    type: [QuestGoalDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestGoalDto)
  goals: QuestGoalDto[];

  @ApiProperty({
    description: 'Quest rewards / 보상 설정 일람',
    type: [QuestRewardDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestRewardDto)
  rewards: QuestRewardDto[];
}
