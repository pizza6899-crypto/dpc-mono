import { Module } from '@nestjs/common';
import { ConcurrencyService } from './concurrency.service';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { EnvModule } from '../env/env.module';

@Module({
  imports: [RedisModule, EnvModule],
  providers: [ConcurrencyService],
  exports: [ConcurrencyService],
})
export class ConcurrencyModule {}
