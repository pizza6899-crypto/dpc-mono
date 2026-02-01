import { Language, Prisma, TierEvaluationCycle } from '@prisma/client';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

export interface TierTranslationProps {
    language: Language;
    name: string;
    description: string | null;
}

export type TierRawPayload = Prisma.TierGetPayload<{ include: { translations: true } }>;

export class Tier {
    constructor(
        public readonly id: bigint,
        public readonly rank: number,
        public readonly code: string,
        public readonly requirementUsd: Prisma.Decimal,
        public readonly requirementDepositUsd: Prisma.Decimal,
        public readonly maintenanceRollingUsd: Prisma.Decimal,
        public readonly evaluationCycle: TierEvaluationCycle,
        public readonly levelUpBonusUsd: Prisma.Decimal,
        public readonly levelUpBonusWageringMultiplier: Prisma.Decimal,
        public readonly isImmediateBonusEnabled: boolean,
        public readonly compRate: Prisma.Decimal,
        public readonly lossbackRate: Prisma.Decimal,
        public readonly rakebackRate: Prisma.Decimal,
        public readonly reloadBonusRate: Prisma.Decimal,
        public readonly dailyWithdrawalLimitUsd: Prisma.Decimal,
        public readonly isWithdrawalUnlimited: boolean,
        public readonly hasDedicatedManager: boolean,
        public readonly isVIPEventEligible: boolean,
        public readonly imageUrl: string | null,
        public readonly updatedAt: Date,
        public readonly updatedBy: bigint | null,
        public readonly translations: TierTranslationProps[],
        private readonly currentLanguage: Language | null = null,
    ) { }

    getName(language?: Language): string {
        const targetLang = language || this.currentLanguage;
        if (targetLang) {
            const found = this.translations.find(t => t.language === targetLang);
            if (found) return found.name;
        }

        const enParams = this.translations.find(t => t.language === Language.EN);
        if (enParams) return enParams.name;

        return this.translations[0]?.name ?? this.code;
    }

    getDescription(language?: Language): string | null {
        const targetLang = language || this.currentLanguage;
        if (targetLang) {
            const found = this.translations.find(t => t.language === targetLang);
            if (found) return found.description;
        }

        const enParams = this.translations.find(t => t.language === Language.EN);
        if (enParams) return enParams.description;

        return this.translations[0]?.description ?? null;
    }

    static fromPersistence(
        data: PersistenceOf<TierRawPayload>,
        contextLanguage?: Language
    ): Tier {
        const translations: TierTranslationProps[] = (data.translations || []).map(t => ({
            language: t.language as Language,
            name: t.name,
            description: t.description
        }));

        return new Tier(
            Cast.bigint(data.id),
            data.rank,
            data.code,
            Cast.decimal(data.requirementUsd),
            Cast.decimal(data.requirementDepositUsd),
            Cast.decimal(data.maintenanceRollingUsd),
            data.evaluationCycle as TierEvaluationCycle,
            Cast.decimal(data.levelUpBonusUsd),
            Cast.decimal(data.levelUpBonusWageringMultiplier),
            data.isImmediateBonusEnabled,
            Cast.decimal(data.compRate),
            Cast.decimal(data.lossbackRate),
            Cast.decimal(data.rakebackRate),
            Cast.decimal(data.reloadBonusRate),
            Cast.decimal(data.dailyWithdrawalLimitUsd),
            data.isWithdrawalUnlimited,
            data.hasDedicatedManager,
            data.isVIPEventEligible,
            data.imageUrl,
            Cast.date(data.updatedAt),
            Cast.bigint(data.updatedBy),
            translations,
            contextLanguage ?? (translations.length === 1 ? translations[0].language : null)
        );
    }
}
