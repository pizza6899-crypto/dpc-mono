import { PrismaClient, PromotionTargetType, Language, ExchangeCurrencyCode, PromotionResetType } from '@prisma/client';

export async function seedPromotionCampaigns(prisma: PrismaClient) {
  console.log('   - Seeding Promotion Campaigns...');

  // 1. 100% 신규 가입 보너스 (1차 입금)
  // 설정: 평생 1회 (maxUsagePerUser: 1)
  await prisma.promotion.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      isActive: true,
      targetType: PromotionTargetType.FIRST_DEPOSIT,
      maxUsagePerUser: 1,
      periodicResetType: PromotionResetType.NONE,
      bonusExpiryMinutes: 10080, // 7일
      translations: {
        createMany: {
          data: [
            { language: Language.KO, title: '100% 신규 가입 보너스', description: '생애 첫 입금 시 100% 보너스를 드립니다.' },
            { language: Language.EN, title: '100% Welcome Bonus', description: 'Get a 100% bonus on your very first deposit.' },
            { language: Language.JA, title: '100% 新規登録ボーナス', description: '初回入금시에 100%의 보너스를 드립니다.' },
          ],
        },
      },
      currencyRules: {
        createMany: {
          data: [
            {
              currency: ExchangeCurrencyCode.KRW,
              minDepositAmount: 10000,
              maxDepositAmount: 1000000,
              maxBonusAmount: 1000000,
              bonusRate: 1.0,
              wageringMultiplier: 20.0,
            },
            {
              currency: ExchangeCurrencyCode.USDT,
              minDepositAmount: 10,
              maxDepositAmount: 1000,
              maxBonusAmount: 1000,
              bonusRate: 1.0,
              wageringMultiplier: 20.0,
            },
          ],
        },
      },
    },
  });

  // 2. 매일 첫 입금 10% 보너스
  // 설정: 매일 1회 (maxUsagePerUser: 1, ResetType: DAILY)
  await prisma.promotion.upsert({
    where: { id: 2n },
    update: {},
    create: {
      id: 2n,
      isActive: true,
      targetType: PromotionTargetType.RELOAD_DEPOSIT,
      maxUsagePerUser: 1,
      periodicResetType: PromotionResetType.DAILY,
      bonusExpiryMinutes: 1440, // 1일
      translations: {
        createMany: {
          data: [
            { language: Language.KO, title: '매일 첫 정충 10%', description: '매일 첫 번째 입금 시 10% 추가 보너스!' },
            { language: Language.EN, title: 'Daily First Deposit 10%', description: 'Get a 10% bonus on your first deposit every day!' },
            { language: Language.JA, title: '毎日初回入金 10%', description: '毎日の最初の入金時に10%のボーナスを追加！' },
          ],
        },
      },
      currencyRules: {
        createMany: {
          data: [
            {
              currency: ExchangeCurrencyCode.KRW,
              minDepositAmount: 10000,
              maxBonusAmount: 500000,
              bonusRate: 0.1,
              wageringMultiplier: 5.0,
            },
          ],
        },
      },
    },
  });

  // 3. 첫 출금 전까지 무제한 5% 보너스
  // 설정: 첫 출금 전까지 (targetType: BEFORE_FIRST_WITHDRAWAL)
  await prisma.promotion.upsert({
    where: { id: 3n },
    update: {},
    create: {
      id: 3n,
      isActive: true,
      targetType: PromotionTargetType.BEFORE_FIRST_WITHDRAWAL,
      maxUsagePerUser: null, // 무제한 (출금 전까지)
      translations: {
        createMany: {
          data: [
            { language: Language.KO, title: '첫 출금 전까지 무제한 5%', description: '첫 출금을 성공하기 전까지 모든 입금에 5% 보너스를 드립니다.' },
            { language: Language.EN, title: 'Unlimited 5% Until First Withdrawal', description: 'Get a 5% bonus on all deposits until your first successful withdrawal.' },
            { language: Language.JA, title: '初回出金まで無制限 5%', description: '初回の出金に成功するまで、すべての入金に対して5%のボーナスを差し上げます。' },
          ],
        },
      },
      currencyRules: {
        createMany: {
          data: [
            {
              currency: ExchangeCurrencyCode.KRW,
              minDepositAmount: 10000,
              bonusRate: 0.05,
              wageringMultiplier: 1.0,
            },
          ],
        },
      },
    },
  });

  // 4. 주말 한정 15% 보너스
  // 설정: 토요일(6), 일요일(0) 한정
  await prisma.promotion.upsert({
    where: { id: 4n },
    update: {},
    create: {
      id: 4n,
      isActive: true,
      targetType: PromotionTargetType.RELOAD_DEPOSIT,
      applicableDays: [6, 0],
      translations: {
        createMany: {
          data: [
            { language: Language.KO, title: '주말 특별 15% 보너스', description: '황금 같은 주말, 입금 시 15% 보너스를 드립니다!' },
            { language: Language.EN, title: 'Weekend Special 15% Bonus', description: 'Enjoy your weekend with a 15% bonus on every deposit!' },
            { language: Language.JA, title: '週末限定 15% ボーナス', description: '黄金の週末、入金時に15%のボーナスを差し上げます！' },
          ],
        },
      },
      currencyRules: {
        createMany: {
          data: [
            {
              currency: ExchangeCurrencyCode.KRW,
              minDepositAmount: 30000,
              bonusRate: 0.15,
              wageringMultiplier: 10.0,
            },
          ],
        },
      },
    },
  });

  // 5. 밤 올빼미 해피아워 (22:00 ~ 02:00)
  const startTime = new Date();
  startTime.setHours(22, 0, 0, 0); // 로컬 22:00
  const endTime = new Date();
  endTime.setHours(23, 59, 0, 0); // 로컬 23:59

  await prisma.promotion.upsert({
    where: { id: 5n },
    update: {},
    create: {
      id: 5n,
      isActive: true,
      targetType: PromotionTargetType.RELOAD_DEPOSIT,
      applicableStartTime: startTime,
      applicableEndTime: endTime,
      translations: {
        createMany: {
          data: [
            { language: Language.KO, title: '야간 해피아워 10%', description: '매일 밤 22시 ~ 24시, 입금액의 10%를 돌려드립니다.' },
            { language: Language.EN, title: 'Night Owl Happy Hour 10%', description: 'Every night 22:00 - 00:00, get 10% bonus on your deposits.' },
            { language: Language.JA, title: '深夜ハッピーアワー 10%', description: '毎晩 22:00 ~ 24:00、入金額の10%を 還元いたします。' },
          ],
        },
      },
      currencyRules: {
        createMany: {
          data: [
            {
              currency: ExchangeCurrencyCode.KRW,
              minDepositAmount: 10000,
              bonusRate: 0.1,
              wageringMultiplier: 3.0,
            },
          ],
        },
      },
    },
  });

  // 6. 2차 입금 보너스 (Welcome Package)
  await prisma.promotion.upsert({
    where: { id: 6n },
    update: {},
    create: {
      id: 6n,
      isActive: true,
      targetType: PromotionTargetType.SECOND_DEPOSIT,
      maxUsagePerUser: 1,
      translations: {
        createMany: {
          data: [
            { language: Language.KO, title: '2차 입금 50% 보너스', description: '두 번째 입금 시 50% 보너스를 드립니다.' },
            { language: Language.EN, title: '2nd Deposit 50% Bonus', description: 'Get a 50% bonus on your second deposit.' },
            { language: Language.JA, title: '2回目入金 50% ボーナス', description: '2回目の入金時に50%のボーナス을 드립니다.' },
          ],
        },
      },
      currencyRules: {
        createMany: {
          data: [
            {
              currency: ExchangeCurrencyCode.KRW,
              minDepositAmount: 10000,
              bonusRate: 0.5,
              wageringMultiplier: 15.0,
            },
          ],
        },
      },
    },
  });

  console.log('   ✅ Promotion campaigns seeded.');
}
