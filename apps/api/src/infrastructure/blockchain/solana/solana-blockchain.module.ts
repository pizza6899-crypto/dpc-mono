import { Module, Global } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { SolanaBlockchainController } from './solana-blockchain.controller';
import { CacheModule } from 'src/common/cache/cache.module';
import { EnvModule } from 'src/common/env/env.module';

/**
 * [Support] Solana 블록체인 연동 유틸리티 모듈
 */
@Global()
@Module({
  imports: [CacheModule, EnvModule],
  controllers: [SolanaBlockchainController],
  providers: [SolanaService],
  exports: [SolanaService],
})
export class SolanaBlockchainModule { }
