import { Injectable, Logger } from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import { CacheService } from 'src/infrastructure/cache/cache.service';
import { CACHE_CONFIG } from 'src/infrastructure/cache/cache.constants';
import { EnvService } from 'src/infrastructure/env/env.service';

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private readonly connection: Connection;
  private readonly publicConnection: Connection;

  constructor(
    private readonly cacheService: CacheService,
    private readonly envService: EnvService,
  ) {
    const rpcUrl = this.envService.solana.rpcUrl;
    this.connection = new Connection(rpcUrl);
    this.publicConnection = new Connection('https://api.mainnet-beta.solana.com');
  }

  /**
   * 현재 슬롯(Slot) 번호를 가져옵니다. (캐싱 적용)
   */
  async getCurrentSlot(): Promise<number> {
    return this.cacheService.getOrSet(
      CACHE_CONFIG.BLOCKCHAIN.SOLANA_CURRENT_SLOT,
      async () => {
        return await this.connection.getSlot({
          commitment: 'confirmed',
        });
      },
    );
  }

  /**
   * 특정 범위 내의 확정된 슬롯 번호 목록을 가져옵니다.
   */
  async getBlocks(startSlot: number, endSlot?: number): Promise<number[]> {
    try {
      return await this.publicConnection.getBlocks(
        startSlot,
        endSlot,
        'confirmed',
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch blocks (start: ${startSlot}, end: ${endSlot})`,
        error,
      );
      throw error;
    }
  }

  /**
   * 특정 슬롯(Slot) 번호에 해당하는 블록해시를 조회합니다.
   */
  async getBlockHashBySlot(slot: number): Promise<string | null> {
    try {
      const block = await this.publicConnection.getBlock(slot, {
        maxSupportedTransactionVersion: 0,
        transactionDetails: 'none', // 트랜잭션 내용을 제외하고 메타데이터만 요청하여 효율적으로 조회
        commitment: 'confirmed',
      });

      return block?.blockhash ?? null;
    } catch (error) {
      this.logger.error(`Failed to fetch blockhash for slot: ${slot}`, error);
      throw error;
    }
  }
}
