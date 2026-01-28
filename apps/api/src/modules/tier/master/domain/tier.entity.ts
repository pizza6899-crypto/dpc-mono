import { Language, Prisma, TierEvaluationCycle } from '@prisma/client';

export interface TierTranslationProps {
    language: Language;
    name: string;
    description: string | null;
}

export class Tier {
    constructor(
        public readonly id: bigint,
        public readonly priority: number,
        public readonly code: string,
        // Requirements
        public readonly requirementUsd: Prisma.Decimal,
        public readonly requirementDepositUsd: Prisma.Decimal,
        public readonly maintenanceRollingUsd: Prisma.Decimal,
        public readonly evaluationCycle: TierEvaluationCycle,
        // Benefits
        public readonly levelUpBonusUsd: Prisma.Decimal,
        public readonly levelUpBonusWageringMultiplier: Prisma.Decimal,
        public readonly compRate: Prisma.Decimal,
        public readonly lossbackRate: Prisma.Decimal,
        public readonly rakebackRate: Prisma.Decimal,
        public readonly reloadBonusRate: Prisma.Decimal,
        // Limits & Rules
        public readonly dailyWithdrawalLimitUsd: Prisma.Decimal,
        public readonly isWithdrawalUnlimited: boolean,
        public readonly hasDedicatedManager: boolean,
        public readonly isVIPEventEligible: boolean,
        // UI & Meta
        public readonly imageUrl: string | null,
        public readonly updatedAt: Date,
        public readonly updatedBy: bigint | null,
        // Translations
        public readonly translations: TierTranslationProps[],
        private readonly currentLanguage: Language | null = null,
    ) { }

    /**
     * 현재 컨텍스트(언어)에 맞는 이름 반환
     * 1. 지정된 언어의 번역
     * 2. 현재 설정된 언어의 번역
     * 3. 영어(EN) 번역 (Fallback)
     * 4. 첫 번째 번역
     * 5. 코드(Code) 반환
     */
    getName(language?: Language): string {
        const targetLang = language || this.currentLanguage;
        if (targetLang) {
            const found = this.translations.find(t => t.language === targetLang);
            if (found) return found.name;
        }

        // Fallback to English
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
        data: Prisma.TierGetPayload<{ include: { translations: true } }>,
        contextLanguage?: Language
    ): Tier {
        const translations: TierTranslationProps[] = data.translations.map(t => ({
            language: t.language,
            name: t.name,
            description: t.description
        }));

        return new Tier(
            data.id, data.priority, data.code,
            data.requirementUsd, data.requirementDepositUsd, data.maintenanceRollingUsd,
            data.evaluationCycle,
            data.levelUpBonusUsd, data.levelUpBonusWageringMultiplier,
            data.compRate, data.lossbackRate, data.rakebackRate, data.reloadBonusRate,
            data.dailyWithdrawalLimitUsd, data.isWithdrawalUnlimited,
            data.hasDedicatedManager, data.isVIPEventEligible,
            data.imageUrl,
            data.updatedAt,
            data.updatedBy,
            translations,
            // 영속성 레이어에서 특정 언어로 필터링해서 가져왔다면 그 언어를 기본 컨텍스트로 설정
            contextLanguage ?? (data.translations.length === 1 ? data.translations[0].language : null)
        );
    }
}
