import { PrismaClient, ExchangeCurrencyCode } from '@prisma/client';
import { StatResetPriceTable } from '../../src/modules/gamification/catalog/domain/gamification-config.entity';

/**
 * 게이미피케이션 전역 설정 초기 데이터 시딩
 * (XP 획득 배율, 스탯 초기화 가격 등)
 */
export async function seedGamificationConfig(prisma: PrismaClient) {
  const configId = 1;

  const resetPrices: StatResetPriceTable = {
    [ExchangeCurrencyCode.USD]: 10,
    [ExchangeCurrencyCode.KRW]: 13000,
    [ExchangeCurrencyCode.JPY]: 1500,
    [ExchangeCurrencyCode.PHP]: 550,
    [ExchangeCurrencyCode.IDR]: 155000,
    [ExchangeCurrencyCode.VND]: 250000,
    [ExchangeCurrencyCode.USDT]: 10,
    [ExchangeCurrencyCode.BTC]: 0.00015,
    [ExchangeCurrencyCode.ETH]: 0.003,
    [ExchangeCurrencyCode.SOL]: 0.06,
    [ExchangeCurrencyCode.XRP]: 15,
    [ExchangeCurrencyCode.DOGE]: 60,
    [ExchangeCurrencyCode.LTC]: 0.12,
    [ExchangeCurrencyCode.BCH]: 0.02,
    [ExchangeCurrencyCode.EOS]: 12,
    [ExchangeCurrencyCode.TRX]: 85,
  };

  await prisma.gamificationConfig.upsert({
    where: { id: configId },
    update: {},
    create: {
      id: configId,
      xpGrantMultiplierUsd: 1.0,
      statPointsGrantPerLevel: 1,
      maxStatLimit: 999,
      statResetPrices: resetPrices as any,
    },
  });

  console.log('✅ Gamification seeder: Global config seeding completed.');
}

/**
 * 레벨 정의 초기 데이터 시딩 (1~10레벨)
 */
export async function seedLevelDefinitions(prisma: PrismaClient) {
  const levels = [
    { level: 1, requiredXp: 0, tierCode: 'WHITE', levelUpStatPoints: 0 },
    { level: 2, requiredXp: 100, tierCode: 'WHITE', levelUpStatPoints: 1 },
    { level: 3, requiredXp: 300, tierCode: 'WHITE', levelUpStatPoints: 1 },
    { level: 4, requiredXp: 600, tierCode: 'WHITE', levelUpStatPoints: 1 },
    { level: 5, requiredXp: 1000, tierCode: 'WHITE', levelUpStatPoints: 5 },
    { level: 6, requiredXp: 1500, tierCode: 'BRONZE', levelUpStatPoints: 2 },
    { level: 7, requiredXp: 2200, tierCode: 'BRONZE', levelUpStatPoints: 2 },
    { level: 8, requiredXp: 3000, tierCode: 'BRONZE', levelUpStatPoints: 2 },
    { level: 9, requiredXp: 4000, tierCode: 'BRONZE', levelUpStatPoints: 2 },
    { level: 10, requiredXp: 5500, tierCode: 'BRONZE', levelUpStatPoints: 10 },
  ];

  for (const l of levels) {
    await prisma.levelDefinition.upsert({
      where: { level: l.level },
      update: {},
      create: {
        level: l.level,
        requiredXp: l.requiredXp,
        tierCode: l.tierCode as any,
        levelUpStatPoints: l.levelUpStatPoints,
      },
    });
  }

  console.log('✅ Gamification seeder: Level definitions seeding completed.');
}
