import { PrismaClient, ExchangeCurrencyCode } from '@prisma/client';
import { StatResetPriceTable } from '../../src/modules/gamification/catalog/domain/gamification-config.entity';

/**
 * 게이미피케이션 전역 설정 초기 데이터 시딩
 */
export async function seedGamificationConfig(prisma: PrismaClient) {
  const configId = 1;

  // 모든 지원 통화에 대한 초기 초기화 가격 설정 (대략적인 가치 기준)
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
    update: {}, // 이미 데이터가 존재한다면 덮어쓰지 않음 (실수로 인한 데이터 손실 방지)
    create: {
      id: configId,
      xpGrantMultiplierUsd: 1.0,
      statPointsGrantPerLevel: 1,
      maxStatLimit: 999,
      statResetPrices: resetPrices as any,
    },
  });

  console.log('✅ GamificationConfig seeding completed (Only if not exist).');
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
      update: {}, // 이미 정의된 레벨 정보가 있다면 덮어쓰지 않음
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
