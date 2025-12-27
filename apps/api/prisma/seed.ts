import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeders/user.seeder';
import { seedVipLevels } from './seeders/vip-level.seeder';
import { seedPromotions } from './seeders/promotion.seeder';
import { seedLobbyGames } from './seeders/game.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시딩을 시작합니다...');

  try {
    // 유저 시딩 처리
    await seedUsers(prisma);
    console.log('✅ 유저 시딩이 완료되었습니다.');
    
    // VIP 레벨 시딩 처리
    await seedVipLevels(prisma);
    console.log('✅ VIP 레벨 시딩이 완료되었습니다.');

    // 프로모션 시딩 처리
    await seedPromotions(prisma);
    console.log('✅ 프로모션 시딩이 완료되었습니다.');

    // 게임 시딩 처리
    await seedLobbyGames(prisma);
    console.log('✅ 게임 시딩이 완료되었습니다.');
    
  } catch (error) {
    console.error('❌ 시딩 중 오류가 발생했습니다:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
