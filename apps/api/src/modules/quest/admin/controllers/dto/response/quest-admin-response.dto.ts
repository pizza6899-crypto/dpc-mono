import { ApiProperty } from '@nestjs/swagger';
import { QuestType, QuestCategory, ResetCycle, RewardType, ExchangeCurrencyCode, Language } from '@prisma/client';

export class QuestMetadataResponseDto {
  @ApiProperty({ description: 'Is hot quest', nullable: true })
  isHot: boolean | null;

  @ApiProperty({ description: 'Is new quest', nullable: true })
  isNew: boolean | null;

  @ApiProperty({ description: 'Icon file ID', nullable: true })
  iconFileId: string | null;

  @ApiProperty({ description: 'Icon URL', nullable: true })
  iconUrl: string | null;

  @ApiProperty({ description: 'Display order', nullable: true })
  displayOrder: number | null;
}

export class QuestEntryRuleResponseDto {
  @ApiProperty({ description: 'Require no withdrawal history', nullable: true })
  requireNoWithdrawal: boolean | null;
}

export class QuestMatchRuleResponseDto {
  // 정의된 필드 없음
}

export class QuestRewardValueResponseDto {
  @ApiProperty({ description: 'Reward amount', nullable: true })
  amount: number | null;

  @ApiProperty({ description: 'Reward point', nullable: true })
  point: number | null;

  @ApiProperty({ description: 'Badge ID', nullable: true })
  badgeId: string | null;

  @ApiProperty({ description: 'Coupon ID', nullable: true })
  couponId: string | null;
}

export class QuestGoalResponseDto {
  @ApiProperty({ description: 'Goal ID' })
  id: string;

  @ApiProperty({ description: 'Parent Quest ID' })
  questMasterId: string;

  @ApiProperty({ description: 'Currency code', enum: ExchangeCurrencyCode, nullable: true })
  currency: ExchangeCurrencyCode | null;

  @ApiProperty({ description: 'Target amount', nullable: true })
  targetAmount: number | null;

  @ApiProperty({ description: 'Target count', nullable: true })
  targetCount: number | null;

  @ApiProperty({ description: 'Match rule settings', type: QuestMatchRuleResponseDto })
  matchRule: QuestMatchRuleResponseDto;
}

export class QuestRewardResponseDto {
  @ApiProperty({ description: 'Reward ID' })
  id: string;

  @ApiProperty({ description: 'Parent Quest ID' })
  questMasterId: string;

  @ApiProperty({ description: 'Reward type', enum: RewardType })
  type: RewardType;

  @ApiProperty({ description: 'Currency code', enum: ExchangeCurrencyCode, nullable: true })
  currency: ExchangeCurrencyCode | null;

  @ApiProperty({ description: 'Reward value/settings', type: QuestRewardValueResponseDto })
  value: QuestRewardValueResponseDto;

  @ApiProperty({ description: 'Expiration days', nullable: true })
  expireDays: number | null;

  @ApiProperty({ description: 'Wagering multiplier' })
  wageringMultiplier: number;
}

export class QuestTranslationResponseDto {
  @ApiProperty({ description: 'Translation ID' })
  id: string;

  @ApiProperty({ description: 'Parent Quest ID' })
  questMasterId: string;

  @ApiProperty({ description: 'Language code', enum: Language })
  language: Language;

  @ApiProperty({ description: 'Quest title' })
  title: string;

  @ApiProperty({ description: 'Quest description', nullable: true })
  description: string | null;
}

export class QuestAdminResponseDto {
  @ApiProperty({ description: 'Quest ID' })
  id: string;

  @ApiProperty({ description: 'Quest type', enum: QuestType })
  type: QuestType;

  @ApiProperty({ description: 'Quest category', enum: QuestCategory })
  category: QuestCategory;

  @ApiProperty({ description: 'Reset cycle', enum: ResetCycle })
  resetCycle: ResetCycle;

  @ApiProperty({ description: 'Max participation attempts', nullable: true })
  maxAttempts: number | null;

  @ApiProperty({ description: 'Is quest active' })
  isActive: boolean;

  @ApiProperty({ description: 'Parent quest ID', nullable: true })
  parentId: string | null;

  @ApiProperty({ description: 'Preceding quest ID', nullable: true })
  precedingId: string | null;

  @ApiProperty({ description: 'Quest metadata/styling', type: QuestMetadataResponseDto })
  metadata: QuestMetadataResponseDto;

  @ApiProperty({ description: 'Entry rule settings', type: QuestEntryRuleResponseDto })
  entryRule: QuestEntryRuleResponseDto;

  @ApiProperty({ description: 'Quest updated by user ID', nullable: true })
  updatedBy: string | null;

  @ApiProperty({ description: 'Quest start time', nullable: true })
  startTime: Date | null;

  @ApiProperty({ description: 'Quest end time', nullable: true })
  endTime: Date | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Quest goals', type: [QuestGoalResponseDto] })
  goals: QuestGoalResponseDto[];

  @ApiProperty({ description: 'Quest rewards', type: [QuestRewardResponseDto] })
  rewards: QuestRewardResponseDto[];

  @ApiProperty({ description: 'Translations', type: [QuestTranslationResponseDto] })
  translations: QuestTranslationResponseDto[];
}
