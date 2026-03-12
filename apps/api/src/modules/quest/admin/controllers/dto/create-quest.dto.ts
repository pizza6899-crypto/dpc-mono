import { QuestType, QuestCategory, ResetCycle, RewardType, ExchangeCurrencyCode, Language } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';

export class QuestGoalDto {
  @IsEnum(ExchangeCurrencyCode)
  @IsOptional()
  currency?: ExchangeCurrencyCode;

  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @IsNumber()
  @IsOptional()
  targetCount?: number;

  @IsOptional()
  matchRule?: any;
}

export class QuestRewardDto {
  @IsEnum(RewardType)
  type: RewardType;

  @IsEnum(ExchangeCurrencyCode)
  @IsOptional()
  currency?: ExchangeCurrencyCode;

  @IsOptional()
  value?: any;

  @IsNumber()
  @IsOptional()
  expireDays?: number;

  @IsNumber()
  @IsOptional()
  wageringMultiplier?: number;
}

export class QuestTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateQuestDto {
  @IsEnum(QuestType)
  type: QuestType;

  @IsEnum(QuestCategory)
  category: QuestCategory;

  @IsEnum(ResetCycle)
  @IsOptional()
  resetCycle?: ResetCycle;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  entryRule?: any;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestTranslationDto)
  translations: QuestTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestGoalDto)
  goals: QuestGoalDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestRewardDto)
  rewards: QuestRewardDto[];
}
