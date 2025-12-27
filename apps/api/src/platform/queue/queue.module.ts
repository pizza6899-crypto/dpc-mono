import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '../redis/redis.module';
import { EnvModule } from '../env/env.module';
import { QueueService } from './queue.service';
import { EnvService } from '../env/env.service';
import { QueueNames } from './queue.types';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    RedisModule,
    EnvModule,
    PrismaModule,
    BullModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (envService: EnvService) => ({
        connection: {
          host: envService.redis.host,
          port: envService.redis.port,
          password: envService.redis.password,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [EnvService],
    }),
    BullModule.registerQueue({
      name: QueueNames.WHITECLIFF_FETCH_GAME_RESULT_URL,
    }),
    BullModule.registerQueue({
      name: QueueNames.DCS_FETCH_GAME_REPLAY_URL,
    }),
    BullModule.registerQueue({
      name: QueueNames.GAME_POST_PROCESS,
    }),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
