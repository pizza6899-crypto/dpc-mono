import { Language, PrismaClient, PromotionQualificationCondition } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export async function seedPromotions(prisma: PrismaClient) {
  // 첫 충전 프로모션
  const firstDepositPromotion = await prisma.promotion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      managementName: '첫 충전 100% 보너스',
      isActive: true,
      startDate: null, // 기간 제한 없음
      endDate: null, // 기간 제한 없음
      targetType: 'NEW_USER_FIRST_DEPOSIT',
      bonusType: 'PERCENTAGE',
      bonusRate: new Decimal(1.0), // 100%
      minDepositAmount: new Decimal(10), // 최소 10 USDT
      maxBonusAmount: new Decimal(1000), // 최대 1000 USDT
      rollingMultiplier: new Decimal(20.0), // 20배 롤링
      qualificationMaintainCondition: PromotionQualificationCondition.UNTIL_FIRST_WITHDRAWAL,
    },
  });

  // 첫 충전 프로모션 번역
  const firstDepositTranslations = [
    {
      promotionId: firstDepositPromotion.id,
      language: Language.KO,
      name: '첫 충전 100% 보너스',
      description: '신규 가입 후 첫 충전 시 입금 금액의 100% 보너스를 받으세요! (최소 입금: 10 USDT, 최대 보너스: 1,000 USDT)',
    },
    {
      promotionId: firstDepositPromotion.id,
      language: Language.EN,
      name: 'First Deposit 100% Bonus',
      description: 'Get 100% bonus on your first deposit after registration! (Min deposit: 10 USDT, Max bonus: 1,000 USDT)',
    },
    {
      promotionId: firstDepositPromotion.id,
      language: Language.JA,
      name: '初回入金100%ボーナス',
      description: '新規登録後の初回入金で入金額の100%ボーナスを受け取ろう！ (最低入金: 10 USDT、最大ボーナス: 1,000 USDT)',
    },
  ];

  for (const translation of firstDepositTranslations) {
    await prisma.promotionTranslation.upsert({
      where: {
        promotionId_language: {
          promotionId: translation.promotionId,
          language: translation.language,
        },
      },
      update: {
        name: translation.name,
        description: translation.description,
      },
      create: translation,
    });
  }

  console.log(`✅ 프로모션이 시딩되었습니다. (첫 충전 프로모션: 1개, 번역: ${firstDepositTranslations.length}개)`);
}
