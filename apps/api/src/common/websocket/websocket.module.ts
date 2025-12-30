import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { RedisModule } from '../redis/redis.module';
import { EnvModule } from '../env/env.module';
import { SessionModule } from 'src/modules/auth/session/session.module';

@Module({
  imports: [RedisModule, EnvModule, SessionModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
