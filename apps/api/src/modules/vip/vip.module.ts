import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';
import { VipLevelService } from './application/vip-level.service';
import { VipMembershipService } from './application/vip-membership.service';
import { VipRewardService } from './application/vip-reward.service';
import { VipLevelController } from './controllers/vip-level.controller';
import { VipMembershipController } from './controllers/vip-membership.controller';

@Module({
  imports: [PrismaModule, ConcurrencyModule, ActivityLogModule],
  providers: [VipLevelService, VipMembershipService, VipRewardService],
  controllers: [VipLevelController, VipMembershipController],
  exports: [VipLevelService, VipMembershipService, VipRewardService],
})
export class VipModule {}
