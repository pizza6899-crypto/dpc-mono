import type { Prisma, TierEvaluationCycle } from '@prisma/client';
import { Language } from '@prisma/client';
import type { PersistenceOf } from 'src/infrastructure/persistence/persistence.util';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

export interface TierTranslationProps {
  language: Language;
  name: string;
  description: string | null;
}

export type TierRawPayload = Prisma.TierGetPayload<{
  include: { translations: true };
}>;

export class Tier {
  constructor(
    public readonly id: bigint,
    public readonly level: number,
    public readonly code: string,

    // Requirements
    public readonly upgradeRollingRequiredUsd: Prisma.Decimal,
    public readonly upgradeDepositRequiredUsd: Prisma.Decimal,
    public readonly maintainRollingRequiredUsd: Prisma.Decimal,
    public readonly evaluationCycle: TierEvaluationCycle,

    // Benefits
    public readonly upgradeBonusUsd: Prisma.Decimal,
    public readonly upgradeBonusWageringMultiplier: Prisma.Decimal,
    public readonly isImmediateBonusEnabled: boolean,
    public readonly compRate: Prisma.Decimal,
    public readonly weeklyLossbackRate: Prisma.Decimal,
    public readonly monthlyLossbackRate: Prisma.Decimal,

    public readonly dailyWithdrawalLimitUsd: Prisma.Decimal,
    public readonly isWithdrawalUnlimited: boolean,
    public readonly hasDedicatedManager: boolean,
    public readonly rewardExpiryDays: number | null,

    // Status & Control
    public readonly isActive: boolean,
    public readonly isHidden: boolean,
    public readonly isManualOnly: boolean,

    // UI & Audit
    public readonly imageUrl: string | null,
    public readonly updatedAt: Date,
    public readonly updatedBy: bigint | null,
    public readonly translations: TierTranslationProps[],
    private readonly currentLanguage: Language | null = null,
  ) {}

  getName(language?: Language): string {
    const targetLang = language || this.currentLanguage;
    if (targetLang) {
      const found = this.translations.find((t) => t.language === targetLang);
      if (found) return found.name;
    }

    const enParams = this.translations.find((t) => t.language === Language.EN);
    if (enParams) return enParams.name;

    return this.translations[0]?.name ?? this.code;
  }

  getDescription(language?: Language): string | null {
    const targetLang = language || this.currentLanguage;
    if (targetLang) {
      const found = this.translations.find((t) => t.language === targetLang);
      if (found) return found.description;
    }

    const enParams = this.translations.find((t) => t.language === Language.EN);
    if (enParams) return enParams.description;

    return this.translations[0]?.description ?? null;
  }

  static fromPersistence(
    data: PersistenceOf<TierRawPayload>,
    contextLanguage?: Language,
  ): Tier {
    const translations: TierTranslationProps[] = (data.translations || []).map(
      (t) => ({
        language: t.language,
        name: t.name,
        description: t.description,
      }),
    );

    return new Tier(
      Cast.bigint(data.id),
      data.level,
      data.code,
      Cast.decimal(data.upgradeRollingRequiredUsd),
      Cast.decimal(data.upgradeDepositRequiredUsd),
      Cast.decimal(data.maintainRollingRequiredUsd),
      data.evaluationCycle,
      Cast.decimal(data.upgradeBonusUsd),
      Cast.decimal(data.upgradeBonusWageringMultiplier),
      data.isImmediateBonusEnabled,
      Cast.decimal(data.compRate),
      Cast.decimal(data.weeklyLossbackRate),
      Cast.decimal(data.monthlyLossbackRate),
      Cast.decimal(data.dailyWithdrawalLimitUsd),
      data.isWithdrawalUnlimited,
      data.hasDedicatedManager,
      data.rewardExpiryDays,
      data.isActive,
      data.isHidden,
      data.isManualOnly,
      data.imageUrl,
      Cast.date(data.updatedAt),
      Cast.bigint(data.updatedBy),
      translations,
      contextLanguage ??
        (translations.length === 1 ? translations[0].language : null),
    );
  }
}
