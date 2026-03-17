import { PrismaClient, PromotionTargetType, PromotionBonusType, Language, ExchangeCurrencyCode } from '@prisma/client';

export async function seedPromotions(prisma: PrismaClient) {
  console.log('   - Seeding Promotion Config...');
  await prisma.promotionConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
    },
  });

  console.log('   - Seeding Promotions...');

  // 1. 신규 가입 100% 보너스
  const welcomeBonus = await prisma.promotion.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      isActive: true,
      targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
      bonusType: PromotionBonusType.PERCENTAGE,
      bonusExpiryMinutes: 10080, // 7일
      translations: {
        createMany: {
          data: [
            { language: Language.KO, title: '100% 신규 가입 보너스', description: '생애 첫 입금 시 100% 보너스를 드립니다.' },
            { language: Language.EN, title: '100% Welcome Bonus', description: 'Get a 100% bonus on your very first deposit.' },
          ],
        },
      },
      currencyRules: {
        createMany: {
          data: [
            {
              currency: ExchangeCurrencyCode.KRW,
              minDepositAmount: 10000,
              maxDepositAmount: 1000000,
              maxBonusAmount: 1000000,
              bonusRate: 1.0,
              wageringMultiplier: 20.0,
            },
            {
              currency: ExchangeCurrencyCode.USDT,
              minDepositAmount: 10,
              maxDepositAmount: 1000,
              maxBonusAmount: 1000,
              bonusRate: 1.0,
              wageringMultiplier: 20.0,
            },
          ],
        },
      },
    },
  });

  console.log('   ✅ Promotions seeded.');
}
