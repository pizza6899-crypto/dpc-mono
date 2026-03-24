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

/**
 * 샘플 아이템 카탈로그 시딩 (Artifact)
 */
export async function seedItemCatalog(prisma: PrismaClient) {
  const items = [
    {
      code: 'START_RING',
      type: 'ARTIFACT',
      expiryType: 'PERMANENT',
      maxUsageCount: null,
      effects: [
        { type: 'STAT_BOOST', target: 'LUC', value: 5 }
      ],
      translations: [
        { language: 'KO', name: '시작의 반지', description: '모험의 시작을 함께하는 소박한 반지입니다.' },
        { language: 'EN', name: 'Ring of Beginnings', description: 'A humble ring that accompanies the start of your adventure.' }
      ]
    },
    {
      code: 'LUCKY_CHARM_30',
      type: 'ARTIFACT',
      expiryType: 'DAILY_AUTOMATIC',
      maxUsageCount: 30,
      effects: [
        { type: 'STAT_BOOST', target: 'LUC', value: 10 }
      ],
      translations: [
        { language: 'KO', name: '30일 행운 부적', description: '30일 동안 매일 행운을 가져다줍니다.' },
        { language: 'EN', name: '30-Day Lucky Charm', description: 'Brings luck every day for 30 days.' }
      ]
    }
  ];

  for (const item of items) {
    await prisma.itemCatalog.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        type: item.type as any,
        expiryType: item.expiryType as any,
        maxUsageCount: item.maxUsageCount,
        effects: item.effects as any,
        translations: {
          create: item.translations as any
        }
      }
    });
  }

  console.log('✅ ItemCatalog (Artifacts) seeding completed.');
}
