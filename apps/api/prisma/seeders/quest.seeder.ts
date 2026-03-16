import { PrismaClient, QuestType, ResetCycle, RewardType, Language, ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { QuestEntryRule, QuestMatchRule, QuestRewardValue } from '../../src/modules/quest/core/domain/models/quest.interface';

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
    // Prisma.QuestMasterCreateInput을 기본으로 사용하되, 인라인으로 타입을 지정하여 가독성 확보
    const quests: (Omit<Prisma.QuestMasterCreateInput, 'entryRule'> & { entryRule: QuestEntryRule })[] = [
        {
            type: QuestType.DEPOSIT,
            resetCycle: ResetCycle.NONE,
            maxAttempts: 1,
            entryRule: { isFirstDepositOnly: true, requireNoWithdrawal: true },
            translations: {
                create: [
                    { language: Language.KO, title: '신규 가입 첫 입금 보너스', description: '생애 첫 입금 시 입금액의 100% 보너스 지급' },
                    { language: Language.EN, title: 'New Member First Deposit Bonus', description: '100% bonus on your very first deposit' },
                ]
            },
            goals: {
                create: [
                    { currency: ExchangeCurrencyCode.KRW, targetAmount: 10000, targetCount: 1 },
                    { currency: ExchangeCurrencyCode.USD, targetAmount: 10, targetCount: 1 },
                ]
            },
            rewards: {
                create: [
                    {
                        type: RewardType.BONUS_MONEY,
                        value: { bonusRate: 1.0, maxAmount: 500000 } as QuestRewardValue as any,
                        wageringMultiplier: 3.0
                    }
                ]
            }
        }
    ];

    for (const q of quests) {
        // 타이틀로 중복 체크 (첫 번째 KO 타이틀 기준)
        const koTitle = (q.translations?.create as any[])[0].title;
        const existingQuest = await prisma.questMaster.findFirst({
            where: {
                translations: {
                    some: { title: koTitle }
                }
            }
        });

        if (!existingQuest) {
            await prisma.questMaster.create({
                data: {
                    ...q,
                    entryRule: q.entryRule as any,
                }
            });
            console.log(`   ✅ Quest [${koTitle}] seeded.`);
        }
    }
}
