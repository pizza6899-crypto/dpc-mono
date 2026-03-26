import { PrismaClient, ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';
import {
  ArtifactDrawPriceTable,
  ArtifactSynthesisConfigTable,
  ArtifactSlotUnlockConfig
} from '../../src/modules/artifact/master/domain/artifact-policy.entity';

/**
 * 유물(Artifact) 설정 및 마스터 데이터 시딩
 */
export async function seedArtifactCatalog(prisma: PrismaClient) {
  // 1. 유물 등급별 뽑기 확률 설정 (총합 1.0)
  const drawConfigs = [
    { grade: ArtifactGrade.COMMON, probability: 0.499 }, // 합계 1.0을 위해 0.1% 조정
    { grade: ArtifactGrade.UNCOMMON, probability: 0 },
    { grade: ArtifactGrade.RARE, probability: 0.30 },
    { grade: ArtifactGrade.EPIC, probability: 0.17 },
    { grade: ArtifactGrade.LEGENDARY, probability: 0.03 },
    { grade: ArtifactGrade.MYTHIC, probability: 0.001 },
    { grade: ArtifactGrade.UNIQUE, probability: 0 },
  ];

  for (const config of drawConfigs) {
    await prisma.artifactDrawConfig.upsert({
      where: { grade: config.grade },
      update: {},
      create: { grade: config.grade, probability: config.probability },
    });
  }

  // 2. 유물 전역 정책 설정 (Singleton ID: 1)
  const drawPrices: ArtifactDrawPriceTable = {
    SINGLE: {
      [ExchangeCurrencyCode.KRW]: 10000,
      [ExchangeCurrencyCode.USD]: 10,
      [ExchangeCurrencyCode.USDT]: 10,
      [ExchangeCurrencyCode.JPY]: 1500,
      [ExchangeCurrencyCode.PHP]: 500,
      [ExchangeCurrencyCode.IDR]: 150000,
      [ExchangeCurrencyCode.VND]: 250000,
      [ExchangeCurrencyCode.BTC]: 0.0002,
      [ExchangeCurrencyCode.ETH]: 0.003,
      [ExchangeCurrencyCode.SOL]: 0.06,
      [ExchangeCurrencyCode.XRP]: 15,
      [ExchangeCurrencyCode.DOGE]: 60,
      [ExchangeCurrencyCode.LTC]: 0.12,
      [ExchangeCurrencyCode.BCH]: 0.02,
      [ExchangeCurrencyCode.EOS]: 12,
      [ExchangeCurrencyCode.TRX]: 80,
    },
    TEN: {
      [ExchangeCurrencyCode.KRW]: 90000,
      [ExchangeCurrencyCode.USD]: 90,
      [ExchangeCurrencyCode.USDT]: 90,
      [ExchangeCurrencyCode.JPY]: 13500,
      [ExchangeCurrencyCode.PHP]: 4500,
      [ExchangeCurrencyCode.IDR]: 1350000,
      [ExchangeCurrencyCode.VND]: 2250000,
      [ExchangeCurrencyCode.BTC]: 0.0018,
      [ExchangeCurrencyCode.ETH]: 0.027,
      [ExchangeCurrencyCode.SOL]: 0.54,
      [ExchangeCurrencyCode.XRP]: 135,
      [ExchangeCurrencyCode.DOGE]: 540,
      [ExchangeCurrencyCode.LTC]: 1.08,
      [ExchangeCurrencyCode.BCH]: 0.18,
      [ExchangeCurrencyCode.EOS]: 108,
      [ExchangeCurrencyCode.TRX]: 720,
    },
  };

  const synthesisConfigs: ArtifactSynthesisConfigTable = {
    [ArtifactGrade.COMMON]: { requiredCount: 3, successRate: 0.2 },
    [ArtifactGrade.UNCOMMON]: { requiredCount: 3, successRate: 0.1667 },
    [ArtifactGrade.RARE]: { requiredCount: 3, successRate: 0.125, guaranteedCount: 20 },
    [ArtifactGrade.EPIC]: { requiredCount: 3, successRate: 0.1111, guaranteedCount: 20 },
    [ArtifactGrade.LEGENDARY]: { requiredCount: 3, successRate: 0.1, guaranteedCount: 20 },
    [ArtifactGrade.MYTHIC]: { requiredCount: 3, successRate: 1.0 },
  };

  const slotUnlockConfigs: ArtifactSlotUnlockConfig = {
    unlockLevels: [1, 1, 50, 100], // 1, 2번 슬롯은 1레벨, 3번은 50레벨, 4번은 100레벨
  };

  await prisma.artifactPolicy.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      drawPrices: drawPrices as any,
      synthesisConfigs: synthesisConfigs as any,
      slotUnlockConfigs: slotUnlockConfigs as any,
    },
  });

  // 3. 샘플 유물 카탈로그 데이터
  const artifacts = [
    {
      code: 'WOODEN_CIRCLE',
      grade: ArtifactGrade.COMMON,
      drawWeight: 100,
      casinoBenefit: 1,
      slotBenefit: 1,
      imageUrl: 'https://placehold.co/200x200?text=Wooden+Circle',
    },
    {
      code: 'IRON_SHIELD',
      grade: ArtifactGrade.UNCOMMON,
      drawWeight: 100,
      casinoBenefit: 3,
      slotBenefit: 3,
      sportsBenefit: 3,
      imageUrl: 'https://placehold.co/200x200?text=Iron+Shield',
    },
    {
      code: 'SILVER_CROWN',
      grade: ArtifactGrade.RARE,
      drawWeight: 100,
      casinoBenefit: 7,
      slotBenefit: 7,
      sportsBenefit: 7,
      minigameBenefit: 7,
      imageUrl: 'https://placehold.co/200x200?text=Silver+Crown',
    },
    {
      code: 'GOLDEN_SCEPTRE',
      grade: ArtifactGrade.EPIC,
      drawWeight: 100,
      casinoBenefit: 15,
      slotBenefit: 15,
      sportsBenefit: 15,
      minigameBenefit: 15,
      badBeatBenefit: 5,
      imageUrl: 'https://placehold.co/200x200?text=Golden+Sceptre',
    },
    {
      code: 'DRAGON_HEART',
      grade: ArtifactGrade.LEGENDARY,
      drawWeight: 100,
      casinoBenefit: 30,
      slotBenefit: 30,
      sportsBenefit: 30,
      minigameBenefit: 30,
      badBeatBenefit: 15,
      criticalBenefit: 10,
      imageUrl: 'https://placehold.co/200x200?text=Dragon+Heart',
    },
    {
      code: 'ETERNAL_FLAME',
      grade: ArtifactGrade.MYTHIC,
      drawWeight: 100,
      casinoBenefit: 70,
      slotBenefit: 70,
      sportsBenefit: 70,
      minigameBenefit: 70,
      badBeatBenefit: 50,
      criticalBenefit: 50,
      imageUrl: 'https://placehold.co/200x200?text=Eternal+Flame',
    },
    {
      code: 'COSMIC_VOID',
      grade: ArtifactGrade.UNIQUE,
      drawWeight: 100,
      casinoBenefit: 150,
      slotBenefit: 150,
      sportsBenefit: 150,
      minigameBenefit: 150,
      badBeatBenefit: 100,
      criticalBenefit: 100,
      imageUrl: 'https://placehold.co/200x200?text=Cosmic+Void',
    }
  ];

  for (const artifact of artifacts) {
    await prisma.artifactCatalog.upsert({
      where: { code: artifact.code },
      update: {},
      create: {
        code: artifact.code,
        grade: artifact.grade,
        drawWeight: artifact.drawWeight,
        casinoBenefit: artifact.casinoBenefit ?? 0,
        slotBenefit: artifact.slotBenefit ?? 0,
        sportsBenefit: artifact.sportsBenefit ?? 0,
        minigameBenefit: artifact.minigameBenefit ?? 0,
        badBeatBenefit: (artifact as any).badBeatBenefit ?? 0,
        criticalBenefit: (artifact as any).criticalBenefit ?? 0,
        imageUrl: artifact.imageUrl,
      }
    });
  }

  // 4. 보너스 풀 초기 설정 (Singleton ID: 1)
  await prisma.artifactBonusPool.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      currentBalanceUsd: 0,
      totalAccumulatedUsd: 0,
      totalDistributedUsd: 0,
    },
  });

  console.log('✅ Artifact seeder: Catalog, policies, and bonus pool seeding completed.');
}


