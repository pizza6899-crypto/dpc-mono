import { PrismaClient } from '@prisma/client';

export async function seedCouponConfig(prisma: PrismaClient) {
  console.log('   - Seeding Coupon Config...');
  await prisma.couponConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isCouponEnabled: true,
      maxDailyAttemptsPerUser: 20,
      defaultExpiryDays: 30,
    },
  });
  console.log('   ✅ Coupon config seeded.');
}
