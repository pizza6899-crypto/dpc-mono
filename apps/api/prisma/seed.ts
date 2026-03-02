import { seedUsers } from './seeders/user.seeder';
import { seedUserConfig } from './seeders/user-config.seeder';
import { seedTiers } from './seeders/tier.seeder';
import { seedNotificationTemplates } from './seeders/notification.seeder';
import { seedAggregators } from './seeders/aggregator.seeder';
import { seedGameProviders } from './seeders/game-provider.seeder';
import { seedGameCategories } from './seeders/game-category.seeder';
import { seedCompConfig } from './seeders/comp-config.seeder';
import { seedWageringConfig } from './seeders/wagering.seeder';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`

// Create the adapter instance
const adapter = new PrismaPg({ connectionString })

// Pass it to the PrismaClient constructor using the 'adapter' property
const prisma = new PrismaClient({ adapter })


async function main() {
  console.log('🌱 시딩을 시작합니다...');

  try {
    // 모든 시딩 처리를 하나의 대규모 트랜잭션으로 묶습니다.
    // 타임아웃을 넉넉하게 잡아줍니다. (e.g. 30초: 30000ms)
    await prisma.$transaction(async (tx) => {
      // 각 시더 함수가 PrismaClient만 받도록 엄격하게 타입이 설정되었을 경우를 대비해 
      // (tx as unknown as PrismaClient) 형태로 캐스팅합니다.
      const prismaTx = tx as unknown as PrismaClient;

      // UserConfig 설정 시딩 처리
      await seedUserConfig(prismaTx);
      console.log('✅ 전역 사용자 설정 시딩이 완료되었습니다.');

      // 유저 시딩 처리
      await seedUsers(prismaTx);
      console.log('✅ 유저 시딩이 완료되었습니다.');

      // 티어 시딩 처리
      await seedTiers(prismaTx);
      console.log('✅ 티어 시딩이 완료되었습니다.');

      // 알림 템플릿 시딩 처리
      await seedNotificationTemplates(prismaTx);
      console.log('✅ 알림 템플릿 시딩이 완료되었습니다.');

      // 카지노 애그리게이터 시딩 처리
      await seedAggregators(prismaTx);
      console.log('✅ 카지노 애그리게이터 시딩이 완료되었습니다.');

      // 카지노 게임 프로바이더 시딩 처리
      await seedGameProviders(prismaTx);
      console.log('✅ 카지노 게임 프로바이더 시딩이 완료되었습니다.');

      // 게임 카테고리 시딩 처리
      await seedGameCategories(prismaTx);
      console.log('✅ 게임 카테고리 시딩이 완료되었습니다.');

      // 콤프 설정 시딩 처리
      await seedCompConfig(prismaTx);
      console.log('✅ 콤프 설정 시딩이 완료되었습니다.');

      // 웨이저링 설정 시딩 처리
      await seedWageringConfig(prismaTx);
      console.log('✅ 웨이저링 설정 시딩이 완료되었습니다.');
    }, {
      maxWait: 10000,   // DB connection을 기다리는 최대 시간 (10초)
      timeout: 30000,   // 트랜잭션이 완료되어야 하는 최대 시간 (30초 제한)
    });

    console.log('🌟 모든 데이터 시딩 및 트랜잭션 커밋이 완료되었습니다!');
  } catch (error) {
    console.error('❌ 시딩 중 오류가 발생했습니다. 트랜잭션이 전체 롤백됩니다:', error);
    throw error;
  }
}

main()
  .catch((e) => {
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
