import { PrismaClient, Language } from '@prisma/client';

export async function seedTiers(prisma: PrismaClient) {
    console.log('🏆 티어 시딩을 시작합니다...');

    const TIERS = [
        {
            priority: 1,
            code: 'BRONZE',
            requirementUsd: 0,
            levelUpBonusUsd: 0,
            compRate: 0.001, // 0.1%
            translations: {
                [Language.KO]: '브론즈',
                [Language.EN]: 'Bronze',
                [Language.JA]: 'ブロンズ',
            },
        },
        {
            priority: 2,
            code: 'SILVER',
            requirementUsd: 10_000,
            levelUpBonusUsd: 50,
            compRate: 0.002, // 0.2%
            translations: {
                [Language.KO]: '실버',
                [Language.EN]: 'Silver',
                [Language.JA]: 'シルバー',
            },
        },
        {
            priority: 3,
            code: 'GOLD',
            requirementUsd: 50_000,
            levelUpBonusUsd: 300,
            compRate: 0.003, // 0.3%
            translations: {
                [Language.KO]: '골드',
                [Language.EN]: 'Gold',
                [Language.JA]: 'ゴールド',
            },
        },
        {
            priority: 4,
            code: 'PLATINUM',
            requirementUsd: 100_000,
            levelUpBonusUsd: 1_000,
            compRate: 0.005, // 0.5%
            translations: {
                [Language.KO]: '플래티넘',
                [Language.EN]: 'Platinum',
                [Language.JA]: 'プラチナ',
            },
        },
        {
            priority: 5,
            code: 'DIAMOND',
            requirementUsd: 500_000,
            levelUpBonusUsd: 5_000,
            compRate: 0.008, // 0.8%
            translations: {
                [Language.KO]: '다이아몬드',
                [Language.EN]: 'Diamond',
                [Language.JA]: 'ダイヤモンド',
            },
        },
        {
            priority: 6,
            code: 'VIP',
            requirementUsd: 1_000_000,
            levelUpBonusUsd: 15_000,
            compRate: 0.01, // 1.0%
            translations: {
                [Language.KO]: 'VIP',
                [Language.EN]: 'VIP',
                [Language.JA]: 'VIP',
            },
        },
    ];

    for (const tierData of TIERS) {
        // 1. Tier Upsert
        const tier = await prisma.tier.upsert({
            where: { code: tierData.code },
            update: {
                priority: tierData.priority,
                requirementUsd: tierData.requirementUsd,
                levelUpBonusUsd: tierData.levelUpBonusUsd,
                compRate: tierData.compRate,
            },
            create: {
                priority: tierData.priority,
                code: tierData.code,
                requirementUsd: tierData.requirementUsd,
                levelUpBonusUsd: tierData.levelUpBonusUsd,
                compRate: tierData.compRate,
            },
        });

        // 2. Translations Upsert
        for (const [lang, name] of Object.entries(tierData.translations)) {
            await prisma.tierTranslation.upsert({
                where: {
                    tierId_language: {
                        tierId: tier.id,
                        language: lang as Language,
                    },
                },
                update: {
                    name: name,
                },
                create: {
                    tierId: tier.id,
                    language: lang as Language,
                    name: name,
                },
            });
        }
    }

    // 3. 글로벌 티어 설정 (TierConfig) 시딩
    // id=1 인 단일 레코드 패턴을 유지하기 위해 1로 강제하거나 upsert 처리
    await prisma.tierConfig.upsert({
        where: { id: 1n },
        update: {
            isPromotionEnabled: true,
            isDowngradeEnabled: false,
            evaluationHourUtc: 20, // 매일 20:00 UTC(한국 시간 새벽 05:00)에 심사 (가장 트래픽이 적은 시간대)
        },
        create: {
            id: 1n,
            isPromotionEnabled: true,
            isDowngradeEnabled: false,
            evaluationHourUtc: 20,
        },
    });

    console.log('✅ 티어 시딩이 완료되었습니다. (글로벌 설정 포함)');
}
