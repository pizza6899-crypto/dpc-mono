import type {
  Prisma,
  TierEvaluationCycle,
  ExchangeCurrencyCode,
} from '@prisma/client';
import { Language } from '@prisma/client';
import type { PersistenceOf } from 'src/infrastructure/persistence/persistence.util';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

export interface TierTranslationProps {
  language: Language;
  name: string;
  description: string | null;
}

export interface TierBenefitProps {
  currency: ExchangeCurrencyCode;
  upgradeBonus: Prisma.Decimal;
  birthdayBonus: Prisma.Decimal;
}

export type TierRawPayload = Prisma.TierGetPayload<{
  include: { translations: true; benefits: true };
}>;

export class Tier {
  constructor(
    public readonly id: bigint,
    public readonly level: number,
    public readonly code: string,

    // Requirements (XP Based)
    public readonly upgradeExpRequired: bigint,
    public readonly evaluationCycle: TierEvaluationCycle,

    // Benefits (Config/Policy)
    public readonly upgradeBonusWageringMultiplier: Prisma.Decimal,
    public readonly compRate: Prisma.Decimal,
    public readonly weeklyLossbackRate: Prisma.Decimal,
    public readonly monthlyLossbackRate: Prisma.Decimal,

    // Limits & Flags
    public readonly dailyWithdrawalLimitUsd: Prisma.Decimal,
    public readonly weeklyWithdrawalLimitUsd: Prisma.Decimal,
    public readonly monthlyWithdrawalLimitUsd: Prisma.Decimal,
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
    public readonly benefits: TierBenefitProps[],
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

  getBenefitByCurrency(
    currency: ExchangeCurrencyCode,
  ): TierBenefitProps | null {
    return this.benefits.find((b) => b.currency === currency) || null;
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

    const benefits: TierBenefitProps[] = (data.benefits || []).map((b) => ({
      currency: b.currency,
      upgradeBonus: Cast.decimal(b.upgradeBonus),
      birthdayBonus: Cast.decimal(b.birthdayBonus),
    }));

    return new Tier(
      Cast.bigint(data.id),
      data.level,
      data.code,
      Cast.bigint(data.upgradeExpRequired),
      data.evaluationCycle,
      Cast.decimal(data.upgradeBonusWageringMultiplier),
      Cast.decimal(data.compRate),
      Cast.decimal(data.weeklyLossbackRate),
      Cast.decimal(data.monthlyLossbackRate),
      Cast.decimal(data.dailyWithdrawalLimitUsd),
      Cast.decimal(data.weeklyWithdrawalLimitUsd),
      Cast.decimal(data.monthlyWithdrawalLimitUsd),
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
      benefits,
      contextLanguage ??
        (translations.length === 1 ? translations[0].language : null),
    );
  }
}
