import { PrismaClient } from '@prisma/client';

/**
 * 게이미피케이션 전역 설정 초기 데이터 시딩
 */
export async function seedGamificationConfig(prisma: PrismaClient) {
  const configId = 1;

  await prisma.gamificationConfig.upsert({
    where: { id: configId },
    update: {},
    create: {
      id: configId,
      expGrantMultiplierUsd: 1.0,
      statPointGrantPerLevel: 1,
      maxStatLimit: 999,
      statResetPrice: 10000,
      statResetCurrency: 'KRW',
    },
  });

  console.log('✅ GamificationConfig seeding completed.');
}
