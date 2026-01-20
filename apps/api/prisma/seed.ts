import { seedUsers } from './seeders/user.seeder';
import { seedTiers } from './seeders/tier.seeder';
import { seedNotificationTemplates } from './seeders/notification.seeder';
import { seedAggregators } from './seeders/aggregator.seeder';
import { seedGameProviders } from './seeders/game-provider.seeder';
import { seedGameCategories } from './seeders/game-category.seeder';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/database';

const connectionString = `${process.env.DATABASE_URL}`

// Create the adapter instance
const adapter = new PrismaPg({ connectionString })

// Pass it to the PrismaClient constructor using the 'adapter' property
const prisma = new PrismaClient({ adapter })


async function main() {
  console.log('🌱 시딩을 시작합니다...');

  try {
    // 유저 시딩 처리
    await seedUsers(prisma);
    console.log('✅ 유저 시딩이 완료되었습니다.');

    // 티어 시딩 처리
    await seedTiers(prisma);
    console.log('✅ 티어 시딩이 완료되었습니다.');

    // 알림 템플릿 시딩 처리
    await seedNotificationTemplates(prisma);
    console.log('✅ 알림 템플릿 시딩이 완료되었습니다.');

    // 카지노 애그리게이터 시딩 처리
    await seedAggregators(prisma);
    console.log('✅ 카지노 애그리게이터 시딩이 완료되었습니다.');

    // 카지노 게임 프로바이더 시딩 처리
    await seedGameProviders(prisma);
    console.log('✅ 카지노 게임 프로바이더 시딩이 완료되었습니다.');

    // 게임 카테고리 시딩 처리
    await seedGameCategories(prisma);
    console.log('✅ 게임 카테고리 시딩이 완료되었습니다.');

  } catch (error) {
    console.error('❌ 시딩 중 오류가 발생했습니다:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
