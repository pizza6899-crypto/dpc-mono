import * as bcrypt from 'bcryptjs';
import { Language, PrismaClient, UserRoleType, UserStatus } from '@repo/database';

export async function seedUsers(prisma: PrismaClient) {
  // 관리자 계정 생성
  const adminPassword = await bcrypt.hash('admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dpc.com' },
    update: {},
    create: {
      email: 'admin@dpc.com',
      passwordHash: adminPassword,
      role: UserRoleType.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      country: 'JP',
      language: Language.KO,
      timezone: 'Asia/Tokyo',
      // userWallets: {
      // create: WALLET_CURRENCIES.map((currency) => ({
      //   currency,
      // })),
      // },
    },
  });

  // 에이전트 계정 생성
  // const agentPassword = await bcrypt.hash('agent123!', 10);
  // const agentUser = await prisma.user.upsert({
  //   where: { email: 'agent@dpc.com' },
  //   update: {},
  //   create: {
  //     email: 'agent@dpc.com',
  //     passwordHash: agentPassword,
  //     role: UserRoleType.AGENT,
  //     status: UserStatus.ACTIVE,
  //     country: 'KR',
  //     language: Language.KO,
  //     timezone: 'Asia/Seoul',
  //     balances: {
  //       create: WALLET_CURRENCIES.map((currency) => ({
  //         currency,
  //       })),
  //     },
  //   },
  // });

  // 테스트 사용자 계정들 생성
  // const testUsers = [
  //   {
  //     email: 'user1@test.com',
  //     password: 'user123!',
  //     country: 'KR',
  //     language: Language.KO,
  //   },
  //   {
  //     email: 'user2@test.com',
  //     password: 'user123!',
  //     country: 'JP',
  //     language: Language.JA,
  //   },
  //   {
  //     email: 'user3@test.com',
  //     password: 'user123!',
  //     country: 'US',
  //     language: Language.EN,
  //   },
  // ];

  // for (const userData of testUsers) {
  //   const passwordHash = await bcrypt.hash(userData.password, 10);
  //   await prisma.user.upsert({
  //     where: { email: userData.email },
  //     update: {},
  //     create: {
  //       email: userData.email,
  //       passwordHash,
  //       role: UserRoleType.USER,
  //       status: UserStatus.ACTIVE,
  //       country: userData.country,
  //       language: userData.language,
  //       timezone: userData.country === 'KR' ? 'Asia/Seoul' : 
  //                userData.country === 'JP' ? 'Asia/Tokyo' : 'America/New_York',
  //     },
  //   });
  // }

  // // 사용자 잔액 생성
  // const users = await prisma.user.findMany({
  //   where: { role: UserRoleType.USER },
  // });

  // // Currency enum의 모든 값 가져오기
  // const allCurrencies = WALLET_CURRENCIES;

  // for (const user of users) {
  //   // 각 사용자에 대해 모든 currency에 대해 잔액 생성
  //   for (const currency of allCurrencies) {
  //     await prisma.userBalance.upsert({
  //       where: { userId_currency: { userId: user.id, currency } },
  //       update: {},
  //       create: {
  //         userId: user.id,
  //         currency,
  //         mainBalance: 0,
  //         balanceLocked: 0,
  //         totalDeposit: 0,
  //         totalWithdraw: 0,
  //         totalBet: 0,
  //         totalWin: 0,
  //         totalBonus: 0,
  //       },
  //     });
  //   }
  // }

  console.log(`✅ 사용자 계정들이 시딩되었습니다. (관리자: 1명)`);
}