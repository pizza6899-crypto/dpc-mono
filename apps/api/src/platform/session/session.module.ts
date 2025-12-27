// src/platform/session/session.module.ts
import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
