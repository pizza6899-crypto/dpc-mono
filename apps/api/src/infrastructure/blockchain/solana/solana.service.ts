import { Injectable, Logger } from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import { CacheService } from 'src/infrastructure/cache/cache.service';
import { CACHE_CONFIG } from 'src/infrastructure/cache/cache.constants';
import { EnvService } from 'src/infrastructure/env/env.service';
import { ThrottleService } from 'src/infrastructure/throttle/throttle.service';
import { ThrottleOptions } from 'src/infrastructure/throttle/types/throttle.types';

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private readonly connection: Connection;
  private readonly publicConnection: Connection;

  constructor(
    private readonly cacheService: CacheService,
    private readonly envService: EnvService,
    private readonly throttleService: ThrottleService,
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
        return await this.callWithThrottle(() => this.connection.getSlot({
          commitment: 'confirmed',
        }));
      },
    );
  }

  /**
   * 특정 범위 내의 확정된 슬롯 번호 목록을 가져옵니다.
   */
  async getBlocks(startSlot: number, endSlot?: number): Promise<number[]> {
    try {
      return await this.callWithThrottle(() => this.connection.getBlocks(
        startSlot,
        endSlot,
        'confirmed',
      ));
    } catch (error) {
      this.logger.error(
        `Failed to fetch blocks (start: ${startSlot}, end: ${endSlot})`,
        error,
      );
      throw error;
    }
  }

  /**
   * 특정 슬롯(Slot) 번호에 해당하는 블록 정보를 조회합니다. (내부 전용)
   */
  private async getBlockBySlot(
    slot: number,
    transactionDetails: 'none' | 'signatures' | 'full' = 'none',
  ) {
    try {
      /**
       * 'signatures' 옵션 사용 시 일부 RPC/라이브러리 버전에서 'transactions' 필드 누락으로 인한 파싱 에러가 발생함.
       * 이를 방지하기 위해 'full' 모드로 가져오되, rewards: false로 최소화하여 조회.
       */
      const details = transactionDetails === 'signatures' ? 'full' : transactionDetails;

      return await this.callWithThrottle(() => this.connection.getBlock(slot, {
        commitment: 'confirmed',
        encoding: 'json',
        transactionDetails: details,
        maxSupportedTransactionVersion: 0,
        rewards: false,
      } as any) as Promise<any>);
    } catch (error) {
      this.logger.error(`Failed to fetch block for slot: ${slot}`, error);
      throw error;
    }
  }

  /**
   * 특정 슬롯(Slot) 번호에 해당하는 블록해시를 조회합니다.
   */
  async getBlockHashBySlot(slot: number): Promise<string | null> {
    return this.cacheService.getOrSet(
      CACHE_CONFIG.BLOCKCHAIN.SOLANA_BLOCKHASH(slot),
      async () => {
        const block = await this.getBlockBySlot(slot, 'none');
        return block?.blockhash ?? null;
      },
    );
  }

  /**
   * RPC 호출에 대한 쓰로틀링을 처리하는 래퍼 (Wait & Retry)
   */
  private async callWithThrottle<T>(fn: () => Promise<T>): Promise<T> {
    const key = 'solana-rpc';
    // 주 계약 RPC의 초당 요청 한도 (유저 피드백: 10 RPS)
    const options: ThrottleOptions = { limit: 10, ttl: 1 };

    let result = await this.throttleService.checkAndIncrement(key, options);

    if (!result.allowed) {
      // 1회 재시도 (재귀 대신 루프나 단발성 대기 사용)
      const waitTime = (result.retryAfter || 1) * 1000;
      this.logger.warn(`Solana RPC rate limit hit. Waiting ${waitTime}ms and retrying...`);

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      result = await this.throttleService.checkAndIncrement(key, options);
      if (!result.allowed) {
        this.logger.error(`Solana RPC rate limit exceeded after retry.`);
        throw new Error('Solana RPC rate limit exceeded');
      }
    }

    return await fn();
  }
}
