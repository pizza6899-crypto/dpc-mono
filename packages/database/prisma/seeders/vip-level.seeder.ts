import { PrismaClient } from "../../src";

export async function seedVipLevels(prisma: PrismaClient) {
  const vipLevels = [
    {
      name: '화이트',
      nameKey: 'white',
      rank: 0,
      requiredRolling: 0,
      levelUpBonus: 0,
      compRate: 0.005, // 0.50%
      paybackBasisRate: 0,
      weeklyBonusRate: 0,
      monthlyBonusRate: 0,
    },
    {
      name: '브론즈1',
      nameKey: 'bronze_1',
      rank: 1,
      requiredRolling: 50,
      levelUpBonus: 1,
      compRate: 0.010, // 1.00%
      paybackBasisRate: 0,
      weeklyBonusRate: 0,
      monthlyBonusRate: 0,
    },
    {
      name: '브론즈2',
      nameKey: 'bronze_2',
      rank: 2,
      requiredRolling: 100,
      levelUpBonus: 1,
      compRate: 0.010, // 1.00%
      paybackBasisRate: 0,
      weeklyBonusRate: 0,
      monthlyBonusRate: 0,
    },
    {
      name: '브론즈3',
      nameKey: 'bronze_3',
      rank: 3,
      requiredRolling: 200,
      levelUpBonus: 2,
      compRate: 0.010, // 1.00%
      paybackBasisRate: 0,
      weeklyBonusRate: 0,
      monthlyBonusRate: 0,
    },
    {
      name: '브론즈4',
      nameKey: 'bronze_4',
      rank: 4,
      requiredRolling: 300,
      levelUpBonus: 2,
      compRate: 0.010, // 1.00%
      paybackBasisRate: 0,
      weeklyBonusRate: 0,
      monthlyBonusRate: 0,
    },
    {
      name: '브론즈5',
      nameKey: 'bronze_5',
      rank: 5,
      requiredRolling: 600,
      levelUpBonus: 3,
      compRate: 0.010, // 1.00%
      paybackBasisRate: 0,
      weeklyBonusRate: 0,
      monthlyBonusRate: 0,
    },
    {
      name: '실버1',
      nameKey: 'silver_1',
      rank: 6,
      requiredRolling: 1000,
      levelUpBonus: 5,
      compRate: 0.0125, // 1.25%
      paybackBasisRate: 0.035,
      weeklyBonusRate: 0.0035,
      monthlyBonusRate: 0,
    },
    {
      name: '실버2',
      nameKey: 'silver_2',
      rank: 7,
      requiredRolling: 2500,
      levelUpBonus: 7,
      compRate: 0.0125, // 1.25%
      paybackBasisRate: 0.035,
      weeklyBonusRate: 0.0035,
      monthlyBonusRate: 0,
    },
    {
      name: '실버3',
      nameKey: 'silver_3',
      rank: 8,
      requiredRolling: 5000,
      levelUpBonus: 10,
      compRate: 0.0125, // 1.25%
      paybackBasisRate: 0.035,
      weeklyBonusRate: 0.0035,
      monthlyBonusRate: 0,
    },
    {
      name: '실버4',
      nameKey: 'silver_4',
      rank: 9,
      requiredRolling: 10000,
      levelUpBonus: 20,
      compRate: 0.0125, // 1.25%
      paybackBasisRate: 0.035,
      weeklyBonusRate: 0.0035,
      monthlyBonusRate: 0,
    },
    {
      name: '실버5',
      nameKey: 'silver_5',
      rank: 10,
      requiredRolling: 15000,
      levelUpBonus: 25,
      compRate: 0.0125, // 1.25%
      paybackBasisRate: 0.035,
      weeklyBonusRate: 0.0035,
      monthlyBonusRate: 0,
    },
    {
      name: '골드1',
      nameKey: 'gold_1',
      rank: 11,
      requiredRolling: 25000,
      levelUpBonus: 50,
      compRate: 0.015, // 1.50%
      paybackBasisRate: 0.04,
      weeklyBonusRate: 0.004,
      monthlyBonusRate: 0.004,
    },
    {
      name: '골드2',
      nameKey: 'gold_2',
      rank: 12,
      requiredRolling: 50000,
      levelUpBonus: 125,
      compRate: 0.015, // 1.50%
      paybackBasisRate: 0.04,
      weeklyBonusRate: 0.004,
      monthlyBonusRate: 0.004,
    },
    {
      name: '골드3',
      nameKey: 'gold_3',
      rank: 13,
      requiredRolling: 100000,
      levelUpBonus: 250,
      compRate: 0.015, // 1.50%
      paybackBasisRate: 0.04,
      weeklyBonusRate: 0.004,
      monthlyBonusRate: 0.004,
    },
    {
      name: '골드4',
      nameKey: 'gold_4',
      rank: 14,
      requiredRolling: 170000,
      levelUpBonus: 350,
      compRate: 0.015, // 1.50%
      paybackBasisRate: 0.04,
      weeklyBonusRate: 0.004,
      monthlyBonusRate: 0.004,
    },
    {
      name: '골드5',
      nameKey: 'gold_5',
      rank: 15,
      requiredRolling: 250000,
      levelUpBonus: 400,
      compRate: 0.015, // 1.50%
      paybackBasisRate: 0.04,
      weeklyBonusRate: 0.004,
      monthlyBonusRate: 0.004,
    },
    {
      name: '플래티넘1',
      nameKey: 'platinum_1',
      rank: 16,
      requiredRolling: 450000,
      levelUpBonus: 1000,
      compRate: 0.0175, // 1.75%
      paybackBasisRate: 0.05,
      weeklyBonusRate: 0.0045,
      monthlyBonusRate: 0.0045,
    },
    {
      name: '플래티넘2',
      nameKey: 'platinum_2',
      rank: 17,
      requiredRolling: 900000,
      levelUpBonus: 2250,
      compRate: 0.0175, // 1.75%
      paybackBasisRate: 0.05,
      weeklyBonusRate: 0.0045,
      monthlyBonusRate: 0.0045,
    },
    {
      name: '플래티넘3',
      nameKey: 'platinum_3',
      rank: 18,
      requiredRolling: 1400000,
      levelUpBonus: 2500,
      compRate: 0.0175, // 1.75%
      paybackBasisRate: 0.05,
      weeklyBonusRate: 0.0045,
      monthlyBonusRate: 0.0045,
    },
    {
      name: '플래티넘4',
      nameKey: 'platinum_4',
      rank: 19,
      requiredRolling: 2000000,
      levelUpBonus: 3000,
      compRate: 0.0175, // 1.75%
      paybackBasisRate: 0.05,
      weeklyBonusRate: 0.0045,
      monthlyBonusRate: 0.0045,
    },
    {
      name: '플래티넘5',
      nameKey: 'platinum_5',
      rank: 20,
      requiredRolling: 3000000,
      levelUpBonus: 5000,
      compRate: 0.0175, // 1.75%
      paybackBasisRate: 0.05,
      weeklyBonusRate: 0.0045,
      monthlyBonusRate: 0.0045,
    },
    {
      name: '다이아몬드1',
      nameKey: 'diamond_1',
      rank: 21,
      requiredRolling: 5000000,
      levelUpBonus: 10000,
      compRate: 0.020, // 2.00%
      paybackBasisRate: 0.06,
      weeklyBonusRate: 0.005,
      monthlyBonusRate: 0.005,
    },
    {
      name: '다이아몬드2',
      nameKey: 'diamond_2',
      rank: 22,
      requiredRolling: 8000000,
      levelUpBonus: 15000,
      compRate: 0.020, // 2.00%
      paybackBasisRate: 0.06,
      weeklyBonusRate: 0.005,
      monthlyBonusRate: 0.005,
    },
    {
      name: '다이아몬드3',
      nameKey: 'diamond_3',
      rank: 23,
      requiredRolling: 12000000,
      levelUpBonus: 20000,
      compRate: 0.020, // 2.00%
      paybackBasisRate: 0.06,
      weeklyBonusRate: 0.005,
      monthlyBonusRate: 0.005,
    },
    {
      name: '다이아몬드4',
      nameKey: 'diamond_4',
      rank: 24,
      requiredRolling: 18000000,
      levelUpBonus: 30000,
      compRate: 0.020, // 2.00%
      paybackBasisRate: 0.06,
      weeklyBonusRate: 0.005,
      monthlyBonusRate: 0.005,
    },
    {
      name: '다이아몬드5',
      nameKey: 'diamond_5',
      rank: 25,
      requiredRolling: 30000000,
      levelUpBonus: 60000,
      compRate: 0.020, // 2.00%
      paybackBasisRate: 0.06,
      weeklyBonusRate: 0.005,
      monthlyBonusRate: 0.005,
    },
    {
      name: '마스터1',
      nameKey: 'master_1',
      rank: 26,
      requiredRolling: 50000000,
      levelUpBonus: 100000,
      compRate: 0.025, // 2.50%
      paybackBasisRate: 0.075,
      weeklyBonusRate: 0.006,
      monthlyBonusRate: 0.006,
    },
    {
      name: '마스터2',
      nameKey: 'master_2',
      rank: 27,
      requiredRolling: 100000000,
      levelUpBonus: 250000,
      compRate: 0.025, // 2.50%
      paybackBasisRate: 0.075,
      weeklyBonusRate: 0.006,
      monthlyBonusRate: 0.006,
    },
    {
      name: '마스터3',
      nameKey: 'master_3',
      rank: 28,
      requiredRolling: 200000000,
      levelUpBonus: 500000,
      compRate: 0.025, // 2.50%
      paybackBasisRate: 0.075,
      weeklyBonusRate: 0.006,
      monthlyBonusRate: 0.006,
    },
    {
      name: '그랜드마스터',
      nameKey: 'grandmaster',
      rank: 29,
      requiredRolling: 500000000,
      levelUpBonus: 1500000,
      compRate: 0.030, // 3.00%
      paybackBasisRate: 0.1,
      weeklyBonusRate: 0.007,
      monthlyBonusRate: 0.007,
    },
  ];

  for (const level of vipLevels) {
    await prisma.vipLevel.upsert({
      where: { name: level.name },
      update: level,
      create: level,
    });
  }

  console.log(`✅ ${vipLevels.length}개의 VIP 레벨이 시딩되었습니다.`);
}
