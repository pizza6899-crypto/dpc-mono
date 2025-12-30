// src/platform/throttle/throttle.module.ts
import { Module } from '@nestjs/common';
import { ThrottleService } from './throttle.service';
import { ThrottleGuard } from './throttle.guard';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [ThrottleService, ThrottleGuard],
  exports: [ThrottleService, ThrottleGuard],
})
export class ThrottleModule {}
