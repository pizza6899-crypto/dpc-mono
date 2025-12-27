import { Module } from '@nestjs/common';
import { ActivityLogAdapter } from './activity-log.adapter';
import { PrismaModule } from '../prisma/prisma.module';
import { ACTIVITY_LOG } from './activity-log.token';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: ACTIVITY_LOG,
      useClass: ActivityLogAdapter,
    },
  ],
  exports: [ACTIVITY_LOG],
})
export class ActivityLogModule {}
