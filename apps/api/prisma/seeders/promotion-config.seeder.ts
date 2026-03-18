import { PrismaClient } from '@prisma/client';

export async function seedPromotionConfig(prisma: PrismaClient) {
  console.log('   - Seeding Promotion Config...');
  await prisma.promotionConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      defaultAmlDepositMultiplier: 1.0,
      defaultBonusExpiryDays: 30,
      isPromotionEnabled: true,
    },
  });
  console.log('   ✅ Promotion config seeded.');
}
