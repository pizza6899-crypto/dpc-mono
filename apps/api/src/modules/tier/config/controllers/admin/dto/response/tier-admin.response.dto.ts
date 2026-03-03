import { ApiProperty } from '@nestjs/swagger';
import {
  Language,
  TierEvaluationCycle,
  ExchangeCurrencyCode,
} from '@prisma/client';

export class TierTranslationResponseDto {
  @ApiProperty({ enum: Language })
  language: Language;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  description: string | null;
}

export class TierBenefitResponseDto {
  @ApiProperty({ enum: ExchangeCurrencyCode })
  currency: ExchangeCurrencyCode;

  @ApiProperty({ type: String })
  upgradeBonus: string;

  @ApiProperty({ type: String })
  birthdayBonus: string;
}

export class TierAdminResponseDto {
  @ApiProperty()
  level: number;

  @ApiProperty()
  code: string;

  @ApiProperty({ type: String })
  upgradeExpRequired: string;

  @ApiProperty({ enum: TierEvaluationCycle })
  evaluationCycle: TierEvaluationCycle;

  @ApiProperty({ type: String })
  upgradeBonusWageringMultiplier: string;

  @ApiProperty({ type: Number, nullable: true })
  rewardExpiryDays: number | null;

  @ApiProperty({ type: String })
  compRate: string;

  @ApiProperty({ type: String })
  weeklyLossbackRate: string;

  @ApiProperty({ type: String })
  monthlyLossbackRate: string;

  @ApiProperty({ type: String })
  dailyWithdrawalLimitUsd: string;

  @ApiProperty({ type: String })
  weeklyWithdrawalLimitUsd: string;

  @ApiProperty({ type: String })
  monthlyWithdrawalLimitUsd: string;

  @ApiProperty()
  isWithdrawalUnlimited: boolean;

  @ApiProperty()
  hasDedicatedManager: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isHidden: boolean;

  @ApiProperty()
  isManualOnly: boolean;

  @ApiProperty({ required: false, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: [TierTranslationResponseDto] })
  translations: TierTranslationResponseDto[];

  @ApiProperty({ type: [TierBenefitResponseDto] })
  benefits: TierBenefitResponseDto[];

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: String, nullable: true })
  updatedBy: string | null;
}
