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

/**
 * 레벨 정의 초기 데이터 시딩 (1~10레벨)
 */
export async function seedLevelDefinitions(prisma: PrismaClient) {
  const levels = [
    { level: 1, requiredXp: 0, tierCode: 'WHITE', statPointsBoost: 0 },
    { level: 2, requiredXp: 100, tierCode: 'WHITE', statPointsBoost: 1 },
    { level: 3, requiredXp: 300, tierCode: 'WHITE', statPointsBoost: 1 },
    { level: 4, requiredXp: 600, tierCode: 'WHITE', statPointsBoost: 1 },
    { level: 5, requiredXp: 1000, tierCode: 'WHITE', statPointsBoost: 5 },
    { level: 6, requiredXp: 1500, tierCode: 'BRONZE', statPointsBoost: 2 },
    { level: 7, requiredXp: 2200, tierCode: 'BRONZE', statPointsBoost: 2 },
    { level: 8, requiredXp: 3000, tierCode: 'BRONZE', statPointsBoost: 2 },
    { level: 9, requiredXp: 4000, tierCode: 'BRONZE', statPointsBoost: 2 },
    { level: 10, requiredXp: 5500, tierCode: 'BRONZE', statPointsBoost: 10 },
  ];

  for (const l of levels) {
    await prisma.levelDefinition.upsert({
      where: { level: l.level },
      update: {
        requiredXp: l.requiredXp,
        tierCode: l.tierCode as any,
        statPointsBoost: l.statPointsBoost,
      },
      create: {
        level: l.level,
        requiredXp: l.requiredXp,
        tierCode: l.tierCode as any,
        statPointsBoost: l.statPointsBoost,
      },
    });
  }

  console.log('✅ LevelDefinitions seeding completed.');
}
