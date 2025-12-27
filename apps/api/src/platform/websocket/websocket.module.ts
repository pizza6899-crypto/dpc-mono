import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { RedisModule } from '../redis/redis.module';
import { EnvModule } from '../env/env.module';

@Module({
  imports: [RedisModule, EnvModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
