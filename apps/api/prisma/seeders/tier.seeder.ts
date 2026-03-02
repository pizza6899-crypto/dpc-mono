import { PrismaClient, Language, TierEvaluationCycle, ExchangeCurrencyCode } from '@prisma/client';

/**
 * 초기 시딩용 하드코딩 환율 배율 목록 (USD 기준 대비)
 */
const SEED_EXCHANGE_MULTIPLIERS: Record<ExchangeCurrencyCode, number> = {
    [ExchangeCurrencyCode.USD]: 1,
    [ExchangeCurrencyCode.USDT]: 1,
    [ExchangeCurrencyCode.KRW]: 1400,
    [ExchangeCurrencyCode.JPY]: 150,
    [ExchangeCurrencyCode.PHP]: 56,
    [ExchangeCurrencyCode.IDR]: 16000,
    [ExchangeCurrencyCode.VND]: 25000,
    [ExchangeCurrencyCode.BTC]: 0.00001,
    [ExchangeCurrencyCode.ETH]: 0.0003,
    [ExchangeCurrencyCode.SOL]: 0.007,
    [ExchangeCurrencyCode.XRP]: 2,
    [ExchangeCurrencyCode.DOGE]: 6,
    [ExchangeCurrencyCode.LTC]: 0.012,
    [ExchangeCurrencyCode.BCH]: 0.003,
    [ExchangeCurrencyCode.EOS]: 1.3,
    [ExchangeCurrencyCode.TRX]: 8,
};

/**
 * 티어 시딩 데이터 타입 정의
 * Prisma schema의 Tier 모델과 필드를 1:1로 매칭합니다.
 */
interface TierSeedData {
    level: number;
    code: string;
    // Requirements
    upgradeExpRequired: number; // 승급에 필요한 XP
    evaluationCycle: TierEvaluationCycle;
    // Benefits
    upgradeBonusUsd: number;
    birthdayBonusUsd: number; // 생일 보너스
    upgradeBonusWageringMultiplier: number;
    compRate: number;
    weeklyLossbackRate: number;
    monthlyLossbackRate: number;
    // Limits & VIP
    dailyWithdrawalLimitUsd: number;
    isWithdrawalUnlimited: boolean;
    hasDedicatedManager: boolean;
    // UI
    imageUrl: string | null;
    // Translations
    nameKo: string;
    nameEn: string;
    nameJa: string;
}

export async function seedTiers(prisma: PrismaClient) {
    console.log('🏆 30단계 티어 시스템 시딩을 시작합니다...');

    const TIERS: TierSeedData[] = [
        // Level | Code       | ExpReq | Cycle | Bonus | BdayB | Wager | Comp   | WeeklyLoss | MonthlyLoss | Limit | Unlmt | Mgr   | Image | Name(KO/EN/JA)
        { level: 10, code: 'WHITE', upgradeExpRequired: 0, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 0, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 0, compRate: 0.005, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '화이트', nameEn: 'White', nameJa: 'ホワイト' },
        { level: 20, code: 'BRONZE_1', upgradeExpRequired: 50, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.01, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈1', nameEn: 'Bronze 1', nameJa: 'ブロンズ1' },
        { level: 30, code: 'BRONZE_2', upgradeExpRequired: 100, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.01, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈2', nameEn: 'Bronze 2', nameJa: '브론즈2' },
        { level: 40, code: 'BRONZE_3', upgradeExpRequired: 200, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.01, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5500, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈3', nameEn: 'Bronze 3', nameJa: '브론즈3' },
        { level: 50, code: 'BRONZE_4', upgradeExpRequired: 300, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.01, weeklyLossbackRate: 0.025, monthlyLossbackRate: 0.025, dailyWithdrawalLimitUsd: 6000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈4', nameEn: 'Bronze 4', nameJa: '브론즈4' },
        { level: 60, code: 'BRONZE_5', upgradeExpRequired: 600, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 3, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.01, weeklyLossbackRate: 0.03, monthlyLossbackRate: 0.03, dailyWithdrawalLimitUsd: 7000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈5', nameEn: 'Bronze 5', nameJa: 'ブロンズ5' },

        // 실버
        { level: 70, code: 'SILVER_1', upgradeExpRequired: 1000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 5, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0125, weeklyLossbackRate: 0.032, monthlyLossbackRate: 0.032, dailyWithdrawalLimitUsd: 8000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버1', nameEn: 'Silver 1', nameJa: 'シルバー1' },
        { level: 80, code: 'SILVER_2', upgradeExpRequired: 2500, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 7, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0125, weeklyLossbackRate: 0.035, monthlyLossbackRate: 0.035, dailyWithdrawalLimitUsd: 10000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버2', nameEn: 'Silver 2', nameJa: 'シルバー2' },
        { level: 90, code: 'SILVER_3', upgradeExpRequired: 5000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 10, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0125, weeklyLossbackRate: 0.038, monthlyLossbackRate: 0.038, dailyWithdrawalLimitUsd: 12000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버3', nameEn: 'Silver 3', nameJa: 'シルバー3' },
        { level: 100, code: 'SILVER_4', upgradeExpRequired: 10000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 20, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0125, weeklyLossbackRate: 0.04, monthlyLossbackRate: 0.04, dailyWithdrawalLimitUsd: 15000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버4', nameEn: 'Silver 4', nameJa: 'シルバー4' },
        { level: 110, code: 'SILVER_5', upgradeExpRequired: 15000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 25, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0125, weeklyLossbackRate: 0.045, monthlyLossbackRate: 0.045, dailyWithdrawalLimitUsd: 20000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버5', nameEn: 'Silver 5', nameJa: 'シルバー5' },

        // 골드
        { level: 120, code: 'GOLD_1', upgradeExpRequired: 25000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 50, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.015, weeklyLossbackRate: 0.05, monthlyLossbackRate: 0.05, dailyWithdrawalLimitUsd: 25000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드1', nameEn: 'Gold 1', nameJa: 'ゴールド1' },
        { level: 130, code: 'GOLD_2', upgradeExpRequired: 50000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 125, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.015, weeklyLossbackRate: 0.055, monthlyLossbackRate: 0.055, dailyWithdrawalLimitUsd: 30000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드2', nameEn: 'Gold 2', nameJa: 'ゴールド2' },
        { level: 140, code: 'GOLD_3', upgradeExpRequired: 100000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 250, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.015, weeklyLossbackRate: 0.06, monthlyLossbackRate: 0.06, dailyWithdrawalLimitUsd: 35000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드3', nameEn: 'Gold 3', nameJa: 'ゴールド3' },
        { level: 150, code: 'GOLD_4', upgradeExpRequired: 170000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 350, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.015, weeklyLossbackRate: 0.065, monthlyLossbackRate: 0.065, dailyWithdrawalLimitUsd: 40000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드4', nameEn: 'Gold 4', nameJa: 'ゴールド4' },
        { level: 160, code: 'GOLD_5', upgradeExpRequired: 250000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 400, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.015, weeklyLossbackRate: 0.07, monthlyLossbackRate: 0.07, dailyWithdrawalLimitUsd: 45000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드5', nameEn: 'Gold 5', nameJa: 'ゴールド5' },

        // 플래티넘
        { level: 170, code: 'PLATINUM_1', upgradeExpRequired: 450000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0175, weeklyLossbackRate: 0.075, monthlyLossbackRate: 0.075, dailyWithdrawalLimitUsd: 50000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '플래티넘1', nameEn: 'Platinum 1', nameJa: 'プラチナ1' },
        { level: 180, code: 'PLATINUM_2', upgradeExpRequired: 900000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2250, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0175, weeklyLossbackRate: 0.08, monthlyLossbackRate: 0.08, dailyWithdrawalLimitUsd: 55000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘2', nameEn: 'Platinum 2', nameJa: 'プラチナ2' },
        { level: 190, code: 'PLATINUM_3', upgradeExpRequired: 1400000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2500, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0175, weeklyLossbackRate: 0.085, monthlyLossbackRate: 0.085, dailyWithdrawalLimitUsd: 60000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘3', nameEn: 'Platinum 3', nameJa: 'プラチナ3' },
        { level: 200, code: 'PLATINUM_4', upgradeExpRequired: 2000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 3000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0175, weeklyLossbackRate: 0.09, monthlyLossbackRate: 0.09, dailyWithdrawalLimitUsd: 70000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘4', nameEn: 'Platinum 4', nameJa: 'プラチナ4' },
        { level: 210, code: 'PLATINUM_5', upgradeExpRequired: 3000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 5000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.0175, weeklyLossbackRate: 0.095, monthlyLossbackRate: 0.095, dailyWithdrawalLimitUsd: 80000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘5', nameEn: 'Platinum 5', nameJa: 'プラチナ5' },

        // 다이아몬드
        { level: 220, code: 'DIAMOND_1', upgradeExpRequired: 5000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 10000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.02, weeklyLossbackRate: 0.10, monthlyLossbackRate: 0.10, dailyWithdrawalLimitUsd: 90000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드1', nameEn: 'Diamond 1', nameJa: 'ダイヤモンド1' },
        { level: 230, code: 'DIAMOND_2', upgradeExpRequired: 8000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 15000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.02, weeklyLossbackRate: 0.11, monthlyLossbackRate: 0.11, dailyWithdrawalLimitUsd: 100000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드2', nameEn: 'Diamond 2', nameJa: 'ダイヤモンド2' },
        { level: 240, code: 'DIAMOND_3', upgradeExpRequired: 12000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 20000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.02, weeklyLossbackRate: 0.12, monthlyLossbackRate: 0.12, dailyWithdrawalLimitUsd: 120000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드3', nameEn: 'Diamond 3', nameJa: 'ダイヤモンド3' },
        { level: 250, code: 'DIAMOND_4', upgradeExpRequired: 18000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 30000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.02, weeklyLossbackRate: 0.13, monthlyLossbackRate: 0.13, dailyWithdrawalLimitUsd: 150000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드4', nameEn: 'Diamond 4', nameJa: 'ダイヤモンド4' },
        { level: 260, code: 'DIAMOND_5', upgradeExpRequired: 30000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 60000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.02, weeklyLossbackRate: 0.14, monthlyLossbackRate: 0.14, dailyWithdrawalLimitUsd: 200000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드5', nameEn: 'Diamond 5', nameJa: 'ダイヤモンド5' },

        // 마스터 / 그랜드마스터
        { level: 270, code: 'MASTER_1', upgradeExpRequired: 50000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 100000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.025, weeklyLossbackRate: 0.15, monthlyLossbackRate: 0.15, dailyWithdrawalLimitUsd: 300000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '마스터1', nameEn: 'Master 1', nameJa: 'マスター1' },
        { level: 280, code: 'MASTER_2', upgradeExpRequired: 100000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 250000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.025, weeklyLossbackRate: 0.16, monthlyLossbackRate: 0.16, dailyWithdrawalLimitUsd: 500000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '마스터2', nameEn: 'Master 2', nameJa: 'マスター2' },
        { level: 290, code: 'MASTER_3', upgradeExpRequired: 200000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 500000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.025, weeklyLossbackRate: 0.18, monthlyLossbackRate: 0.18, dailyWithdrawalLimitUsd: 1000000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '마스터3', nameEn: 'Master 3', nameJa: 'マスター3' },
        { level: 300, code: 'GRANDMASTER', upgradeExpRequired: 500000000, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1500000, birthdayBonusUsd: 0, upgradeBonusWageringMultiplier: 1, compRate: 0.03, weeklyLossbackRate: 0.20, monthlyLossbackRate: 0.20, dailyWithdrawalLimitUsd: 0, isWithdrawalUnlimited: true, hasDedicatedManager: true, imageUrl: null, nameKo: '그랜드마스터', nameEn: 'Grandmaster', nameJa: 'グランドマスター' },
    ];

    for (const t of TIERS) {
        const { nameKo, nameEn, nameJa, ...oldFields } = t;

        const tierFields = {
            level: oldFields.level,
            code: oldFields.code,
            evaluationCycle: oldFields.evaluationCycle,
            upgradeExpRequired: BigInt(oldFields.upgradeExpRequired),
            upgradeBonusWageringMultiplier: oldFields.upgradeBonusWageringMultiplier,
            compRate: oldFields.compRate,
            weeklyLossbackRate: oldFields.weeklyLossbackRate,
            monthlyLossbackRate: oldFields.monthlyLossbackRate,
            dailyWithdrawalLimitUsd: oldFields.dailyWithdrawalLimitUsd,
            weeklyWithdrawalLimitUsd: oldFields.dailyWithdrawalLimitUsd * 7,
            monthlyWithdrawalLimitUsd: oldFields.dailyWithdrawalLimitUsd * 30,
            isWithdrawalUnlimited: oldFields.isWithdrawalUnlimited,
            hasDedicatedManager: oldFields.hasDedicatedManager,
            rewardExpiryDays: null,
            isActive: true,
            isHidden: false,
            isManualOnly: false,
            imageUrl: oldFields.imageUrl,
        };

        let tier = await prisma.tier.findUnique({
            where: { code: t.code },
        });

        if (!tier) {
            tier = await prisma.tier.create({
                data: { ...tierFields },
            });
        }

        const translations = [
            { lang: Language.KO, name: nameKo, desc: `${nameKo} 등급 회원 전용 혜택을 확인하세요.` },
            { lang: Language.EN, name: nameEn, desc: `Check out exclusive benefits for ${nameEn} tier.` },
            { lang: Language.JA, name: nameJa, desc: `${nameJa} ティア会員専用の特典をご確認ください。` },
        ];

        for (const tr of translations) {
            const existingTranslation = await prisma.tierTranslation.findUnique({
                where: { tierId_language: { tierId: tier.id, language: tr.lang } },
            });

            if (!existingTranslation) {
                await prisma.tierTranslation.create({
                    data: { tierId: tier.id, language: tr.lang, name: tr.name, description: tr.desc },
                });
            }
        }

        const rawWalletCurrencies = process.env.WALLET_ALLOWED_CURRENCIES?.split(',').map((c) => c.trim().toUpperCase()) || [];
        const currencies = rawWalletCurrencies.length > 0
            ? Object.values(ExchangeCurrencyCode).filter((c) => rawWalletCurrencies.includes(c))
            : Object.values(ExchangeCurrencyCode);

        for (const currency of currencies) {
            const multiplier = SEED_EXCHANGE_MULTIPLIERS[currency] || 1;
            const convertedUpgradeBonus = oldFields.upgradeBonusUsd * multiplier;
            const convertedBirthdayBonus = oldFields.birthdayBonusUsd * multiplier;

            const existingBenefit = await prisma.tierBenefit.findUnique({
                where: { tierId_currency: { tierId: tier.id, currency } },
            });

            if (!existingBenefit) {
                await prisma.tierBenefit.create({
                    data: { tierId: tier.id, currency, upgradeBonus: convertedUpgradeBonus, birthdayBonus: convertedBirthdayBonus },
                });
            }
        }
    }

    // 글로벌 설정 초기화
    const existingConfig = await prisma.tierConfig.findUnique({
        where: { id: 1n },
    });

    if (!existingConfig) {
        await prisma.tierConfig.create({
            data: {
                id: 1n,
                isUpgradeEnabled: true,
                isDowngradeEnabled: false,
                isBonusEnabled: true,
                defaultDowngradeGracePeriodDays: 7,
                defaultRewardExpiryDays: 30,
                expGrantRollingUsd: 1,
            },
        });
    }

    console.log(`✅ ${TIERS.length}개의 최신화된 티어 데이터 시딩이 완료되었습니다!`);
}
