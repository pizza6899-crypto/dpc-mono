import { PrismaClient, QuestType, QuestCategory, ResetCycle, RewardType, Language, ExchangeCurrencyCode } from '@prisma/client';

export async function seedQuests(prisma: PrismaClient) {
    console.log('   - Seeding Quest System...');

    // 1. Quest System Config
    const existingConfig = await prisma.questSystemConfig.findUnique({
        where: { id: 1n },
    });

    if (!existingConfig) {
        await prisma.questSystemConfig.create({
            data: { id: 1n, isSystemEnabled: true },
        });
        console.log('   ✅ Quest system config seeded.');
    }

    // 2. Initial Quest Masters & Goals & Rewards
    const quests = [
        {
            type: QuestType.DEPOSIT,
            category: QuestCategory.WELCOME,
            resetCycle: ResetCycle.NONE,
            maxAttempts: 1,
            entryRule: { isFirstDepositOnly: true, requireNoWithdrawal: true },
            translations: [
                { language: Language.KO, title: '신규 가입 첫 입금 보너스', description: '생애 첫 입금 시 입금액의 100% 보너스 지급' },
                { language: Language.EN, title: 'New Member First Deposit Bonus', description: '100% bonus on your very first deposit' },
            ],
            goals: [
                { currency: ExchangeCurrencyCode.KRW, targetAmount: 10000, targetCount: 1 },
                { currency: ExchangeCurrencyCode.USD, targetAmount: 10, targetCount: 1 },
            ],
            rewards: [
                {
                    type: RewardType.BONUS_MONEY,
                    value: { rate: 1.0, maxAmount: 500000, usage: { allowedCategories: ['SLOT'] } },
                    wageringMultiplier: 3.0
                }
            ]
        },
        {
            type: QuestType.DEPOSIT,
            category: QuestCategory.WELCOME,
            resetCycle: ResetCycle.NONE,
            maxAttempts: 1,
            entryRule: { isFirstDepositOnly: true, requireNoWithdrawal: true },
            translations: [
                { language: Language.KO, title: '신규 크립토 첫 입금 보너스', description: '크립토 첫 입금 시 120% 보너스 지급' },
                { language: Language.EN, title: 'New Member Crypto First Deposit Bonus', description: '120% bonus on your first crypto deposit' },
            ],
            goals: [
                { currency: ExchangeCurrencyCode.USD, targetAmount: 20, targetCount: 1, matchRule: { method: 'CRYPTO' } },
            ],
            rewards: [
                {
                    type: RewardType.BONUS_MONEY,
                    value: { rate: 1.2, maxAmount: 1000, usage: { allowedCategories: ['SLOT', 'CASINO'] } },
                    wageringMultiplier: 5.0
                }
            ]
        },
        {
            type: QuestType.DEPOSIT,
            category: QuestCategory.RELOAD,
            resetCycle: ResetCycle.NONE,
            maxAttempts: null, // 무제한
            entryRule: { minDepositAmount: 10000 },
            translations: [
                { language: Language.KO, title: '무한 매충 보너스', description: '입금할 때마다 10% 추가 보너스' },
                { language: Language.EN, title: 'Unlimited Reload Bonus', description: 'Get 10% bonus on every deposit' },
            ],
            goals: [
                { currency: ExchangeCurrencyCode.KRW, targetAmount: 10000, targetCount: 1 },
            ],
            rewards: [
                {
                    type: RewardType.BONUS_MONEY,
                    value: { rate: 0.1, maxAmount: 100000 },
                    wageringMultiplier: 1.0
                }
            ]
        },
        {
            type: QuestType.DEPOSIT,
            category: QuestCategory.SPECIAL,
            resetCycle: ResetCycle.WEEKLY,
            maxAttempts: 1,
            entryRule: {},
            translations: [
                { language: Language.KO, title: '주말 핫타임 보너스', description: '주말에만 드리는 특별한 20% 보너스' },
                { language: Language.EN, title: 'Weekend Hot-Time Bonus', description: 'Special 20% bonus only on weekends' },
            ],
            goals: [
                { currency: ExchangeCurrencyCode.KRW, targetAmount: 30000, targetCount: 1 },
            ],
            rewards: [
                {
                    type: RewardType.BONUS_MONEY,
                    value: { rate: 0.2, maxAmount: 200000 },
                    wageringMultiplier: 2.0
                }
            ]
        }
    ];

    for (const q of quests) {
        const existingQuest = await prisma.questMaster.findFirst({
            where: {
                translations: {
                    some: { title: q.translations[0].title }
                }
            }
        });

        if (!existingQuest) {
            await prisma.questMaster.create({
                data: {
                    type: q.type,
                    category: q.category,
                    resetCycle: q.resetCycle,
                    maxAttempts: q.maxAttempts,
                    entryRule: q.entryRule,
                    translations: {
                        create: q.translations
                    },
                    goals: {
                        create: q.goals
                    },
                    rewards: {
                        create: q.rewards
                    }
                }
            });
            console.log(`   ✅ Quest [${q.translations[0].title}] seeded.`);
        }
    }
}
