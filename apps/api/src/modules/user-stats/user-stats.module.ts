import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { UserStatsService } from './application/user-stats.service';

@Module({
  imports: [PrismaModule],
  providers: [UserStatsService],
  exports: [UserStatsService],
})
export class UserStatsModule {}
