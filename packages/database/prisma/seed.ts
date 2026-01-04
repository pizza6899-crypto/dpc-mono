import { seedUsers } from './seeders/user.seeder';
import { seedLobbyGames } from './seeders/game.seeder';
import { PrismaClient } from '../src';
import { PrismaPg } from '@prisma/adapter-pg';

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
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
