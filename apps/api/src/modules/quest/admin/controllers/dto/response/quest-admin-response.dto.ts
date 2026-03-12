import { ApiProperty } from '@nestjs/swagger';
import { QuestType, QuestCategory, ResetCycle, RewardType, ExchangeCurrencyCode, Language } from '@prisma/client';

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

  @ApiProperty({ description: 'Match rule settings (JSON)' })
  matchRule: any;
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

  @ApiProperty({ description: 'Reward value/settings (JSON)' })
  value: any;

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

  @ApiProperty({ description: 'Quest metadata/styling (JSON)' })
  metadata: any;

  @ApiProperty({ description: 'Entry rule settings (JSON)' })
  entryRule: any;

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
