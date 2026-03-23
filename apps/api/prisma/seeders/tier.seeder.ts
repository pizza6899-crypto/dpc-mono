import { PrismaClient, Language, TierEvaluationCycle } from '@prisma/client';

/**
 * 티어 시딩 데이터 타입 정의
 * Prisma schema의 Tier 모델과 필드를 1:1로 매칭합니다.
 */
interface TierSeedData {
    level: number;
    code: string;
    // Requirements
    upgradeExpRequired: bigint;
    evaluationCycle: TierEvaluationCycle;
    // Benefits (Moved upgradeBonusUsd to internal benefit seeding)
    upgradeBonusUsd: number;
    upgradeBonusWageringMultiplier: number;
    compRate: number;
    weeklyLossbackRate: number;
    monthlyLossbackRate: number;
    // Limits & VIP
    dailyWithdrawalLimitUsd: number;
    weeklyWithdrawalLimitUsd: number;
    monthlyWithdrawalLimitUsd: number;
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
    console.log('🏆 모든 필드가 명시된 30단계 티어 시딩을 시작합니다...');

    const TIERS: TierSeedData[] = [
        // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // Level | Code       | ExpReq | Cycle | Bonus | Wager | Comp   | WeeklyLoss | MonthlyLoss | DailyLimit | WeeklyLimit | MonthlyLimit | Unlmt | Mgr   | Image | Name(KO/EN/JA)
        // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        { level: 10, code: 'WHITE', upgradeExpRequired: 0n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 0, upgradeBonusWageringMultiplier: 0, compRate: 0.005, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5000, weeklyWithdrawalLimitUsd: 35000, monthlyWithdrawalLimitUsd: 150000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '화이트', nameEn: 'White', nameJa: 'ホワイト' },
        { level: 20, code: 'BRONZE_1', upgradeExpRequired: 50n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1, upgradeBonusWageringMultiplier: 0, compRate: 0.01, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5000, weeklyWithdrawalLimitUsd: 35000, monthlyWithdrawalLimitUsd: 150000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈1', nameEn: 'Bronze 1', nameJa: 'ブロンズ1' },
        { level: 30, code: 'BRONZE_2', upgradeExpRequired: 100n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1, upgradeBonusWageringMultiplier: 0, compRate: 0.01, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5000, weeklyWithdrawalLimitUsd: 35000, monthlyWithdrawalLimitUsd: 150000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈2', nameEn: 'Bronze 2', nameJa: 'ブロンズ2' },
        { level: 40, code: 'BRONZE_3', upgradeExpRequired: 200n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2, upgradeBonusWageringMultiplier: 0, compRate: 0.01, weeklyLossbackRate: 0.02, monthlyLossbackRate: 0.02, dailyWithdrawalLimitUsd: 5500, weeklyWithdrawalLimitUsd: 38500, monthlyWithdrawalLimitUsd: 165000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈3', nameEn: 'Bronze 3', nameJa: '브론즈3' },
        { level: 50, code: 'BRONZE_4', upgradeExpRequired: 300n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2, upgradeBonusWageringMultiplier: 0, compRate: 0.01, weeklyLossbackRate: 0.025, monthlyLossbackRate: 0.025, dailyWithdrawalLimitUsd: 6000, weeklyWithdrawalLimitUsd: 42000, monthlyWithdrawalLimitUsd: 180000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈4', nameEn: 'Bronze 4', nameJa: '브론즈4' },
        { level: 60, code: 'BRONZE_5', upgradeExpRequired: 600n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 3, upgradeBonusWageringMultiplier: 0, compRate: 0.01, weeklyLossbackRate: 0.03, monthlyLossbackRate: 0.03, dailyWithdrawalLimitUsd: 7000, weeklyWithdrawalLimitUsd: 49000, monthlyWithdrawalLimitUsd: 210000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '브론즈5', nameEn: 'Bronze 5', nameJa: 'ブロンズ5' },

        // 실버
        { level: 70, code: 'SILVER_1', upgradeExpRequired: 1000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 5, upgradeBonusWageringMultiplier: 0, compRate: 0.0125, weeklyLossbackRate: 0.032, monthlyLossbackRate: 0.032, dailyWithdrawalLimitUsd: 8000, weeklyWithdrawalLimitUsd: 56000, monthlyWithdrawalLimitUsd: 240000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버1', nameEn: 'Silver 1', nameJa: 'シルバー1' },
        { level: 80, code: 'SILVER_2', upgradeExpRequired: 2500n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 7, upgradeBonusWageringMultiplier: 0, compRate: 0.0125, weeklyLossbackRate: 0.035, monthlyLossbackRate: 0.035, dailyWithdrawalLimitUsd: 10000, weeklyWithdrawalLimitUsd: 70000, monthlyWithdrawalLimitUsd: 300000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버2', nameEn: 'Silver 2', nameJa: 'シルバー2' },
        { level: 90, code: 'SILVER_3', upgradeExpRequired: 5000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 10, upgradeBonusWageringMultiplier: 0, compRate: 0.0125, weeklyLossbackRate: 0.038, monthlyLossbackRate: 0.038, dailyWithdrawalLimitUsd: 12000, weeklyWithdrawalLimitUsd: 84000, monthlyWithdrawalLimitUsd: 360000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버3', nameEn: 'Silver 3', nameJa: 'シルバー3' },
        { level: 100, code: 'SILVER_4', upgradeExpRequired: 10000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 20, upgradeBonusWageringMultiplier: 0, compRate: 0.0125, weeklyLossbackRate: 0.04, monthlyLossbackRate: 0.04, dailyWithdrawalLimitUsd: 15000, weeklyWithdrawalLimitUsd: 105000, monthlyWithdrawalLimitUsd: 450000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버4', nameEn: 'Silver 4', nameJa: 'シルバー4' },
        { level: 110, code: 'SILVER_5', upgradeExpRequired: 15000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 25, upgradeBonusWageringMultiplier: 0, compRate: 0.0125, weeklyLossbackRate: 0.045, monthlyLossbackRate: 0.045, dailyWithdrawalLimitUsd: 20000, weeklyWithdrawalLimitUsd: 140000, monthlyWithdrawalLimitUsd: 600000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '실버5', nameEn: 'Silver 5', nameJa: 'シルバー5' },

        // 골드
        { level: 120, code: 'GOLD_1', upgradeExpRequired: 25000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 50, upgradeBonusWageringMultiplier: 0, compRate: 0.015, weeklyLossbackRate: 0.05, monthlyLossbackRate: 0.05, dailyWithdrawalLimitUsd: 25000, weeklyWithdrawalLimitUsd: 175000, monthlyWithdrawalLimitUsd: 750000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드1', nameEn: 'Gold 1', nameJa: 'ゴールド1' },
        { level: 130, code: 'GOLD_2', upgradeExpRequired: 50000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 125, upgradeBonusWageringMultiplier: 0, compRate: 0.015, weeklyLossbackRate: 0.055, monthlyLossbackRate: 0.055, dailyWithdrawalLimitUsd: 30000, weeklyWithdrawalLimitUsd: 210000, monthlyWithdrawalLimitUsd: 900000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드2', nameEn: 'Gold 2', nameJa: 'ゴールド2' },
        { level: 140, code: 'GOLD_3', upgradeExpRequired: 100000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 250, upgradeBonusWageringMultiplier: 0, compRate: 0.015, weeklyLossbackRate: 0.06, monthlyLossbackRate: 0.06, dailyWithdrawalLimitUsd: 35000, weeklyWithdrawalLimitUsd: 245000, monthlyWithdrawalLimitUsd: 1050000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드3', nameEn: 'Gold 3', nameJa: 'ゴールド3' },
        { level: 150, code: 'GOLD_4', upgradeExpRequired: 170000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 350, upgradeBonusWageringMultiplier: 0, compRate: 0.015, weeklyLossbackRate: 0.065, monthlyLossbackRate: 0.065, dailyWithdrawalLimitUsd: 40000, weeklyWithdrawalLimitUsd: 280000, monthlyWithdrawalLimitUsd: 1200000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드4', nameEn: 'Gold 4', nameJa: 'ゴールド4' },
        { level: 160, code: 'GOLD_5', upgradeExpRequired: 250000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 400, upgradeBonusWageringMultiplier: 0, compRate: 0.015, weeklyLossbackRate: 0.07, monthlyLossbackRate: 0.07, dailyWithdrawalLimitUsd: 45000, weeklyWithdrawalLimitUsd: 315000, monthlyWithdrawalLimitUsd: 1350000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '골드5', nameEn: 'Gold 5', nameJa: 'ゴールド5' },

        // 플래티넘
        { level: 170, code: 'PLATINUM_1', upgradeExpRequired: 450000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1000, upgradeBonusWageringMultiplier: 0, compRate: 0.0175, weeklyLossbackRate: 0.075, monthlyLossbackRate: 0.075, dailyWithdrawalLimitUsd: 50000, weeklyWithdrawalLimitUsd: 350000, monthlyWithdrawalLimitUsd: 1500000, isWithdrawalUnlimited: false, hasDedicatedManager: false, imageUrl: null, nameKo: '플래티넘1', nameEn: 'Platinum 1', nameJa: 'プラチナ1' },
        { level: 180, code: 'PLATINUM_2', upgradeExpRequired: 900000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2250, upgradeBonusWageringMultiplier: 0, compRate: 0.0175, weeklyLossbackRate: 0.08, monthlyLossbackRate: 0.08, dailyWithdrawalLimitUsd: 55000, weeklyWithdrawalLimitUsd: 385000, monthlyWithdrawalLimitUsd: 1650000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘2', nameEn: 'Platinum 2', nameJa: 'プラチナ2' },
        { level: 190, code: 'PLATINUM_3', upgradeExpRequired: 1400000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 2500, upgradeBonusWageringMultiplier: 0, compRate: 0.0175, weeklyLossbackRate: 0.085, monthlyLossbackRate: 0.085, dailyWithdrawalLimitUsd: 60000, weeklyWithdrawalLimitUsd: 420000, monthlyWithdrawalLimitUsd: 1800000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘3', nameEn: 'Platinum 3', nameJa: 'プラチナ3' },
        { level: 200, code: 'PLATINUM_4', upgradeExpRequired: 2000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 3000, upgradeBonusWageringMultiplier: 0, compRate: 0.0175, weeklyLossbackRate: 0.09, monthlyLossbackRate: 0.09, dailyWithdrawalLimitUsd: 70000, weeklyWithdrawalLimitUsd: 490000, monthlyWithdrawalLimitUsd: 2100000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘4', nameEn: 'Platinum 4', nameJa: 'プラチナ4' },
        { level: 210, code: 'PLATINUM_5', upgradeExpRequired: 3000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 5000, upgradeBonusWageringMultiplier: 0, compRate: 0.0175, weeklyLossbackRate: 0.095, monthlyLossbackRate: 0.095, dailyWithdrawalLimitUsd: 80000, weeklyWithdrawalLimitUsd: 560000, monthlyWithdrawalLimitUsd: 2400000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '플래티넘5', nameEn: 'Platinum 5', nameJa: 'プラチナ5' },

        // 다이아몬드
        { level: 220, code: 'DIAMOND_1', upgradeExpRequired: 5000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 10000, upgradeBonusWageringMultiplier: 0, compRate: 0.02, weeklyLossbackRate: 0.1, monthlyLossbackRate: 0.1, dailyWithdrawalLimitUsd: 90000, weeklyWithdrawalLimitUsd: 630000, monthlyWithdrawalLimitUsd: 2700000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드1', nameEn: 'Diamond 1', nameJa: 'ダイヤモンド1' },
        { level: 230, code: 'DIAMOND_2', upgradeExpRequired: 8000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 15000, upgradeBonusWageringMultiplier: 0, compRate: 0.02, weeklyLossbackRate: 0.11, monthlyLossbackRate: 0.11, dailyWithdrawalLimitUsd: 100000, weeklyWithdrawalLimitUsd: 700000, monthlyWithdrawalLimitUsd: 3000000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드2', nameEn: 'Diamond 2', nameJa: 'ダイヤモンド2' },
        { level: 240, code: 'DIAMOND_3', upgradeExpRequired: 12000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 20000, upgradeBonusWageringMultiplier: 0, compRate: 0.02, weeklyLossbackRate: 0.12, monthlyLossbackRate: 0.12, dailyWithdrawalLimitUsd: 120000, weeklyWithdrawalLimitUsd: 840000, monthlyWithdrawalLimitUsd: 3600000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드3', nameEn: 'Diamond 3', nameJa: 'ダイヤモンド3' },
        { level: 250, code: 'DIAMOND_4', upgradeExpRequired: 18000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 30000, upgradeBonusWageringMultiplier: 0, compRate: 0.02, weeklyLossbackRate: 0.13, monthlyLossbackRate: 0.13, dailyWithdrawalLimitUsd: 150000, weeklyWithdrawalLimitUsd: 1050000, monthlyWithdrawalLimitUsd: 4500000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드4', nameEn: 'Diamond 4', nameJa: 'ダイヤモンド4' },
        { level: 260, code: 'DIAMOND_5', upgradeExpRequired: 30000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 60000, upgradeBonusWageringMultiplier: 0, compRate: 0.02, weeklyLossbackRate: 0.14, monthlyLossbackRate: 0.14, dailyWithdrawalLimitUsd: 200000, weeklyWithdrawalLimitUsd: 1400000, monthlyWithdrawalLimitUsd: 6000000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '다이아몬드5', nameEn: 'Diamond 5', nameJa: 'ダイヤモンド5' },

        // 마스터 / 그랜드마스터
        { level: 270, code: 'MASTER_1', upgradeExpRequired: 50000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 100000, upgradeBonusWageringMultiplier: 0, compRate: 0.025, weeklyLossbackRate: 0.15, monthlyLossbackRate: 0.15, dailyWithdrawalLimitUsd: 300000, weeklyWithdrawalLimitUsd: 2100000, monthlyWithdrawalLimitUsd: 9000000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '마스터1', nameEn: 'Master 1', nameJa: 'マスター1' },
        { level: 280, code: 'MASTER_2', upgradeExpRequired: 100000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 250000, upgradeBonusWageringMultiplier: 0, compRate: 0.025, weeklyLossbackRate: 0.16, monthlyLossbackRate: 0.16, dailyWithdrawalLimitUsd: 500000, weeklyWithdrawalLimitUsd: 3500000, monthlyWithdrawalLimitUsd: 15000000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '마스터2', nameEn: 'Master 2', nameJa: 'マスター2' },
        { level: 290, code: 'MASTER_3', upgradeExpRequired: 200000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 500000, upgradeBonusWageringMultiplier: 0, compRate: 0.025, weeklyLossbackRate: 0.18, monthlyLossbackRate: 0.18, dailyWithdrawalLimitUsd: 1000000, weeklyWithdrawalLimitUsd: 7000000, monthlyWithdrawalLimitUsd: 30000000, isWithdrawalUnlimited: false, hasDedicatedManager: true, imageUrl: null, nameKo: '마스터3', nameEn: 'Master 3', nameJa: 'マスター3' },
        { level: 300, code: 'GRANDMASTER', upgradeExpRequired: 500000000n, evaluationCycle: TierEvaluationCycle.NONE, upgradeBonusUsd: 1500000, upgradeBonusWageringMultiplier: 0, compRate: 0.03, weeklyLossbackRate: 0.2, monthlyLossbackRate: 0.2, dailyWithdrawalLimitUsd: 0, weeklyWithdrawalLimitUsd: 0, monthlyWithdrawalLimitUsd: 0, isWithdrawalUnlimited: true, hasDedicatedManager: true, imageUrl: null, nameKo: '그랜드마스터', nameEn: 'Grandmaster', nameJa: 'グランドマスター' },
    ];

    for (const t of TIERS) {
        const { nameKo, nameEn, nameJa, upgradeBonusUsd, ...tierFields } = t;

        const tier = await prisma.tier.upsert({
            where: { code: t.code },
            update: {},
            create: { ...tierFields },
        });

        // Seed TierBenefit (USD as base)
        const currencies: { code: any, multiplier: number }[] = [
            { code: 'USD', multiplier: 1 },
            { code: 'KRW', multiplier: 1400 },
            { code: 'JPY', multiplier: 150 },
            { code: 'USDT', multiplier: 1 },
        ];

        for (const cur of currencies) {
            await prisma.tierBenefit.upsert({
                where: { tierId_currency: { tierId: tier.id, currency: cur.code } },
                update: {},
                create: {
                    tierId: tier.id,
                    currency: cur.code,
                    upgradeBonus: upgradeBonusUsd * cur.multiplier,
                    birthdayBonus: 0,
                },
            });
        }

        const translations = [
            { lang: Language.KO, name: nameKo, desc: `${nameKo} 등급 회원 전용 혜택을 확인하세요.` },
            { lang: Language.EN, name: nameEn, desc: `Check out exclusive benefits for ${nameEn} tier.` },
            { lang: Language.JA, name: nameJa, desc: `${nameJa} ティア会員専用の特典をご確認ください。` },
        ];

        for (const tr of translations) {
            await prisma.tierTranslation.upsert({
                where: { tierId_language: { tierId: tier.id, language: tr.lang } },
                update: {},
                create: { tierId: tier.id, language: tr.lang, name: tr.name, description: tr.desc },
            });
        }
    }

    // 글로벌 설정 초기화
    await prisma.tierConfig.upsert({
        where: { id: 1n },
        update: {},
        create: {
            id: 1n,
            isUpgradeEnabled: true,
            isDowngradeEnabled: false,
            isBonusEnabled: true,
            defaultDowngradeGracePeriodDays: 7,
            defaultRewardExpiryDays: 30,
            expGrantRollingUsd: 1,
        },
    });

    console.log(`✅ ${TIERS.length}개의 최신화된 티어 데이터 시딩이 완료되었습니다!`);
}
