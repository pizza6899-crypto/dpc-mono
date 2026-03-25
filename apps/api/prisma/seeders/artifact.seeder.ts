import { PrismaClient, ArtifactGrade } from '@prisma/client';

/**
 * 유물(Artifact) 설정 및 마스터 데이터 시딩
 */
export async function seedArtifactCatalog(prisma: PrismaClient) {
  // 1. 유물 등급별 뽑기 확률 설정
  const drawConfigs = [
    { grade: ArtifactGrade.COMMON, probability: 0.70 },
    { grade: ArtifactGrade.RARE, probability: 0.20 },
    { grade: ArtifactGrade.EPIC, probability: 0.08 },
    { grade: ArtifactGrade.LEGENDARY, probability: 0.019 },
    { grade: ArtifactGrade.MYTHIC, probability: 0.001 },
  ];

  for (const config of drawConfigs) {
    await prisma.artifactDrawConfig.upsert({
      where: { grade: config.grade },
      update: { probability: config.probability },
      create: { grade: config.grade, probability: config.probability },
    });
  }

  // 2. 유물 전역 정책 설정 (Singleton ID: 1)
  await prisma.artifactPolicy.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      drawPrices: {
        SINGLE: { USD: 10, KRW: 13000 },
        TEN: { USD: 90, KRW: 117000 },
      } as any,
      maxEquipLimit: 3,
    },
  });

  // 3. 샘플 유물 카탈로그 데이터
  const artifacts = [
    {
      code: 'START_RING',
      grade: ArtifactGrade.COMMON,
      drawWeight: 1000,
      casinoBenefit: 5,
      slotBenefit: 0,
      sportsBenefit: 0,
      minigameBenefit: 0,
      badBeatJackpot: 0,
      criticalJackpot: 0,
    },
    {
      code: 'LUCKY_CHARM_30',
      grade: ArtifactGrade.RARE,
      drawWeight: 500,
      casinoBenefit: 10,
      slotBenefit: 10,
      sportsBenefit: 10,
      minigameBenefit: 10,
      badBeatJackpot: 0,
      criticalJackpot: 0,
    },
    {
      code: 'MYTHIC_SWORD',
      grade: ArtifactGrade.MYTHIC,
      drawWeight: 10,
      casinoBenefit: 100,
      slotBenefit: 100,
      sportsBenefit: 100,
      minigameBenefit: 100,
      badBeatJackpot: 100,
      criticalJackpot: 100,
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
        casinoBenefit: artifact.casinoBenefit,
        slotBenefit: artifact.slotBenefit,
        sportsBenefit: artifact.sportsBenefit,
        minigameBenefit: artifact.minigameBenefit,
        badBeatJackpot: artifact.badBeatJackpot,
        criticalJackpot: artifact.criticalJackpot,
      }
    });
  }

  console.log('✅ Artifact seeder: Catalog and policies seeding completed.');
}
