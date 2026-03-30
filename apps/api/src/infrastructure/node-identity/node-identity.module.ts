import { Module, Global } from '@nestjs/common';
import { NodeIdentityService } from './node-identity.service';
import { RedisModule } from 'src/infrastructure/redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [NodeIdentityService],
  exports: [NodeIdentityService],
})
export class NodeIdentityModule {}
