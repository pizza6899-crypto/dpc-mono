import { PrismaClient, Language, TierEvaluationCycle } from '@prisma/client';

/**
 * 티어 시딩 데이터 타입 정의
 * Prisma schema의 Tier 모델과 필드를 1:1로 매칭합니다.
 */
interface TierSeedData {
    priority: number;
    code: string;
    // Requirements
    requirementUsd: number;
    requirementDepositUsd: number;
    maintenanceRollingUsd: number;
    evaluationCycle: TierEvaluationCycle;
    // Benefits
    levelUpBonusUsd: number;
    levelUpBonusWageringMultiplier: number;
    compRate: number;
    lossbackRate: number;
    rakebackRate: number;
    reloadBonusRate: number;
    // Limits & VIP
    dailyWithdrawalLimitUsd: number;
    isWithdrawalUnlimited: boolean;
    hasDedicatedManager: boolean;
    isVIPEventEligible: boolean;
    // UI
    imageUrl: string | null;
    // Translations
    nameKo: string;
    nameEn: string;
    nameJa: string;
}

export async function seedTiers(prisma: PrismaClient) {
    console.log('🏆 모든 필드가 명시된 30단계 티어 시딩을 시작합니다... (입금/롤링배수 제외)');

    const TIERS: TierSeedData[] = [
        // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // Priority | Code       | ReqUsd | DepUsd | Maint  | Cycle | Bonus | Wager | Comp   | Rake   | Loss   | Reload | Limit | Unlmt | Mgr   | VIP   | Image | Name(KO/EN/JA)
        // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        { priority: 10, code: 'WHITE', requirementUsd: 0, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 0, levelUpBonusWageringMultiplier: 0, compRate: 0.005, rakebackRate: 0.01, lossbackRate: 0.02, reloadBonusRate: 0.00, dailyWithdrawalLimitUsd: 5000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '화이트', nameEn: 'White', nameJa: 'ホワイト' },
        { priority: 20, code: 'BRONZE_1', requirementUsd: 50, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 1, levelUpBonusWageringMultiplier: 0, compRate: 0.01, rakebackRate: 0.01, lossbackRate: 0.02, reloadBonusRate: 0.00, dailyWithdrawalLimitUsd: 5000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '브론즈1', nameEn: 'Bronze 1', nameJa: 'ブロンズ1' },
        { priority: 30, code: 'BRONZE_2', requirementUsd: 100, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 1, levelUpBonusWageringMultiplier: 0, compRate: 0.01, rakebackRate: 0.01, lossbackRate: 0.02, reloadBonusRate: 0.00, dailyWithdrawalLimitUsd: 5000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '브론즈2', nameEn: 'Bronze 2', nameJa: 'ブロンズ2' },
        { priority: 40, code: 'BRONZE_3', requirementUsd: 200, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 2, levelUpBonusWageringMultiplier: 0, compRate: 0.01, rakebackRate: 0.012, lossbackRate: 0.02, reloadBonusRate: 0.00, dailyWithdrawalLimitUsd: 5500, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '브론즈3', nameEn: 'Bronze 3', nameJa: '브론즈3' },
        { priority: 50, code: 'BRONZE_4', requirementUsd: 300, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 2, levelUpBonusWageringMultiplier: 0, compRate: 0.01, rakebackRate: 0.014, lossbackRate: 0.025, reloadBonusRate: 0.01, dailyWithdrawalLimitUsd: 6000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '브론즈4', nameEn: 'Bronze 4', nameJa: '브ロンズ4' },
        { priority: 60, code: 'BRONZE_5', requirementUsd: 600, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 3, levelUpBonusWageringMultiplier: 0, compRate: 0.01, rakebackRate: 0.02, lossbackRate: 0.03, reloadBonusRate: 0.02, dailyWithdrawalLimitUsd: 7000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '브론즈5', nameEn: 'Bronze 5', nameJa: 'ブ론즈5' },

        // 실버
        { priority: 70, code: 'SILVER_1', requirementUsd: 1000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 5, levelUpBonusWageringMultiplier: 0, compRate: 0.0125, rakebackRate: 0.022, lossbackRate: 0.032, reloadBonusRate: 0.03, dailyWithdrawalLimitUsd: 8000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '실버1', nameEn: 'Silver 1', nameJa: 'シルバー1' },
        { priority: 80, code: 'SILVER_2', requirementUsd: 2500, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 7, levelUpBonusWageringMultiplier: 0, compRate: 0.0125, rakebackRate: 0.025, lossbackRate: 0.035, reloadBonusRate: 0.04, dailyWithdrawalLimitUsd: 10000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '실버2', nameEn: 'Silver 2', nameJa: 'シルバー2' },
        { priority: 90, code: 'SILVER_3', requirementUsd: 5000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 10, levelUpBonusWageringMultiplier: 0, compRate: 0.0125, rakebackRate: 0.028, lossbackRate: 0.038, reloadBonusRate: 0.05, dailyWithdrawalLimitUsd: 12000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: false, imageUrl: null, nameKo: '실버3', nameEn: 'Silver 3', nameJa: 'シルバー3' },
        { priority: 100, code: 'SILVER_4', requirementUsd: 10000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 20, levelUpBonusWageringMultiplier: 0, compRate: 0.0125, rakebackRate: 0.03, lossbackRate: 0.04, reloadBonusRate: 0.06, dailyWithdrawalLimitUsd: 15000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '실버4', nameEn: 'Silver 4', nameJa: 'シルバー4' },
        { priority: 110, code: 'SILVER_5', requirementUsd: 15000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 25, levelUpBonusWageringMultiplier: 0, compRate: 0.0125, rakebackRate: 0.035, lossbackRate: 0.045, reloadBonusRate: 0.07, dailyWithdrawalLimitUsd: 20000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '실버5', nameEn: 'Silver 5', nameJa: 'シルバー5' },

        // 골드
        { priority: 120, code: 'GOLD_1', requirementUsd: 25000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 50, levelUpBonusWageringMultiplier: 0, compRate: 0.015, rakebackRate: 0.04, lossbackRate: 0.05, reloadBonusRate: 0.08, dailyWithdrawalLimitUsd: 25000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '골드1', nameEn: 'Gold 1', nameJa: 'ゴールド1' },
        { priority: 130, code: 'GOLD_2', requirementUsd: 50000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 125, levelUpBonusWageringMultiplier: 0, compRate: 0.015, rakebackRate: 0.045, lossbackRate: 0.055, reloadBonusRate: 0.09, dailyWithdrawalLimitUsd: 30000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '골드2', nameEn: 'Gold 2', nameJa: 'ゴールド2' },
        { priority: 140, code: 'GOLD_3', requirementUsd: 100000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 250, levelUpBonusWageringMultiplier: 0, compRate: 0.015, rakebackRate: 0.05, lossbackRate: 0.06, reloadBonusRate: 0.10, dailyWithdrawalLimitUsd: 35000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '골드3', nameEn: 'Gold 3', nameJa: 'ゴールド3' },
        { priority: 150, code: 'GOLD_4', requirementUsd: 170000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 350, levelUpBonusWageringMultiplier: 0, compRate: 0.015, rakebackRate: 0.055, lossbackRate: 0.065, reloadBonusRate: 0.11, dailyWithdrawalLimitUsd: 40000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '골드4', nameEn: 'Gold 4', nameJa: 'ゴールド4' },
        { priority: 160, code: 'GOLD_5', requirementUsd: 250000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 400, levelUpBonusWageringMultiplier: 0, compRate: 0.015, rakebackRate: 0.06, lossbackRate: 0.07, reloadBonusRate: 0.12, dailyWithdrawalLimitUsd: 45000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '골드5', nameEn: 'Gold 5', nameJa: 'ゴールド5' },

        // 플래티넘
        { priority: 170, code: 'PLATINUM_1', requirementUsd: 450000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 1000, levelUpBonusWageringMultiplier: 0, compRate: 0.0175, rakebackRate: 0.065, lossbackRate: 0.075, reloadBonusRate: 0.13, dailyWithdrawalLimitUsd: 50000, isWithdrawalUnlimited: false, hasDedicatedManager: false, isVIPEventEligible: true, imageUrl: null, nameKo: '플래티넘1', nameEn: 'Platinum 1', nameJa: 'プラチナ1' },
        { priority: 180, code: 'PLATINUM_2', requirementUsd: 900000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 2250, levelUpBonusWageringMultiplier: 0, compRate: 0.0175, rakebackRate: 0.07, lossbackRate: 0.08, reloadBonusRate: 0.14, dailyWithdrawalLimitUsd: 55000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '플래티넘2', nameEn: 'Platinum 2', nameJa: 'プラチナ2' },
        { priority: 190, code: 'PLATINUM_3', requirementUsd: 1400000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 2500, levelUpBonusWageringMultiplier: 0, compRate: 0.0175, rakebackRate: 0.075, lossbackRate: 0.085, reloadBonusRate: 0.15, dailyWithdrawalLimitUsd: 60000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '플래티넘3', nameEn: 'Platinum 3', nameJa: 'プラチナ3' },
        { priority: 200, code: 'PLATINUM_4', requirementUsd: 2000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 3000, levelUpBonusWageringMultiplier: 0, compRate: 0.0175, rakebackRate: 0.08, lossbackRate: 0.09, reloadBonusRate: 0.16, dailyWithdrawalLimitUsd: 70000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '플래티넘4', nameEn: 'Platinum 4', nameJa: 'プラチナ4' },
        { priority: 210, code: 'PLATINUM_5', requirementUsd: 3000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 5000, levelUpBonusWageringMultiplier: 0, compRate: 0.0175, rakebackRate: 0.085, lossbackRate: 0.095, reloadBonusRate: 0.17, dailyWithdrawalLimitUsd: 80000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '플래티넘5', nameEn: 'Platinum 5', nameJa: '플래티넘5' },

        // 다이아몬드
        { priority: 220, code: 'DIAMOND_1', requirementUsd: 5000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 10000, levelUpBonusWageringMultiplier: 0, compRate: 0.02, rakebackRate: 0.09, lossbackRate: 0.10, reloadBonusRate: 0.18, dailyWithdrawalLimitUsd: 90000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '다이아몬드1', nameEn: 'Diamond 1', nameJa: 'ダイヤモンド1' },
        { priority: 230, code: 'DIAMOND_2', requirementUsd: 8000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 15000, levelUpBonusWageringMultiplier: 0, compRate: 0.02, rakebackRate: 0.095, lossbackRate: 0.11, reloadBonusRate: 0.19, dailyWithdrawalLimitUsd: 100000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '다이아몬드2', nameEn: 'Diamond 2', nameJa: 'ダイヤモンド2' },
        { priority: 240, code: 'DIAMOND_3', requirementUsd: 12000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 20000, levelUpBonusWageringMultiplier: 0, compRate: 0.02, rakebackRate: 0.10, lossbackRate: 0.12, reloadBonusRate: 0.20, dailyWithdrawalLimitUsd: 120000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '다이아몬드3', nameEn: 'Diamond 3', nameJa: 'ダイヤモンド3' },
        { priority: 250, code: 'DIAMOND_4', requirementUsd: 18000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 30000, levelUpBonusWageringMultiplier: 0, compRate: 0.02, rakebackRate: 0.11, lossbackRate: 0.13, reloadBonusRate: 0.22, dailyWithdrawalLimitUsd: 150000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '다이아몬드4', nameEn: 'Diamond 4', nameJa: 'ダイヤモンド4' },
        { priority: 260, code: 'DIAMOND_5', requirementUsd: 30000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 60000, levelUpBonusWageringMultiplier: 0, compRate: 0.02, rakebackRate: 0.12, lossbackRate: 0.14, reloadBonusRate: 0.25, dailyWithdrawalLimitUsd: 200000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '다이아몬드5', nameEn: 'Diamond 5', nameJa: 'ダイヤモンド5' },

        // 마스터 / 그랜드마스터
        { priority: 270, code: 'MASTER_1', requirementUsd: 50000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 100000, levelUpBonusWageringMultiplier: 0, compRate: 0.025, rakebackRate: 0.13, lossbackRate: 0.15, reloadBonusRate: 0.27, dailyWithdrawalLimitUsd: 300000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '마스터1', nameEn: 'Master 1', nameJa: 'マスター1' },
        { priority: 280, code: 'MASTER_2', requirementUsd: 100000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 250000, levelUpBonusWageringMultiplier: 0, compRate: 0.025, rakebackRate: 0.14, lossbackRate: 0.16, reloadBonusRate: 0.30, dailyWithdrawalLimitUsd: 500000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '마스터2', nameEn: 'Master 2', nameJa: 'マスター2' },
        { priority: 290, code: 'MASTER_3', requirementUsd: 200000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 500000, levelUpBonusWageringMultiplier: 0, compRate: 0.025, rakebackRate: 0.15, lossbackRate: 0.18, reloadBonusRate: 0.35, dailyWithdrawalLimitUsd: 1000000, isWithdrawalUnlimited: false, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '마스터3', nameEn: 'Master 3', nameJa: '마스터3' },
        { priority: 300, code: 'GRANDMASTER', requirementUsd: 500000000, requirementDepositUsd: 0, maintenanceRollingUsd: 0, evaluationCycle: TierEvaluationCycle.NONE, levelUpBonusUsd: 1500000, levelUpBonusWageringMultiplier: 0, compRate: 0.03, rakebackRate: 0.20, lossbackRate: 0.20, reloadBonusRate: 0.50, dailyWithdrawalLimitUsd: 0, isWithdrawalUnlimited: true, hasDedicatedManager: true, isVIPEventEligible: true, imageUrl: null, nameKo: '그랜드마스터', nameEn: 'Grandmaster', nameJa: 'グランドマスター' },
    ];

    for (const t of TIERS) {
        const { nameKo, nameEn, nameJa, ...tierFields } = t;

        const tier = await prisma.tier.upsert({
            where: { code: t.code },
            update: { ...tierFields },
            create: { ...tierFields },
        });

        const translations = [
            { lang: Language.KO, name: nameKo, desc: `${nameKo} 등급 회원 전용 혜택을 확인하세요.` },
            { lang: Language.EN, name: nameEn, desc: `Check out exclusive benefits for ${nameEn} tier.` },
            { lang: Language.JA, name: nameJa, desc: `${nameJa} ティア会員専用の特典をご確認ください。` },
        ];

        for (const tr of translations) {
            await prisma.tierTranslation.upsert({
                where: { tierId_language: { tierId: tier.id, language: tr.lang } },
                update: { name: tr.name, description: tr.desc },
                create: { tierId: tier.id, language: tr.lang, name: tr.name, description: tr.desc },
            });
        }
    }

    // 글로벌 설정 초기화
    await prisma.tierConfig.upsert({
        where: { id: 1n },
        update: {
            triggerIntervalMinutes: 60,
            isBonusEnabled: true,
            defaultGracePeriodDays: 7,
        },
        create: {
            id: 1n,
            isPromotionEnabled: true,
            isDowngradeEnabled: false,
            isBonusEnabled: true,
            triggerIntervalMinutes: 60,
            defaultGracePeriodDays: 7,
        },
    });

    console.log(`✅ ${TIERS.length}개의 모든 필드가 명시된 티어 데이터 시딩이 완료되었습니다!`);
}
