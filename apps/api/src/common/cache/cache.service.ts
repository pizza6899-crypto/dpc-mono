import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import { CacheDefinition } from './cache.constants';

export enum CacheStore {
  MEMORY = 'memory',
  REDIS = 'redis',
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly memoryCache = new Map<
    string,
    { value: any; expiry: number }
  >();

  constructor(private readonly redisService: RedisService) {}

  /**
   * 캐시 데이터를 조회하거나, 없으면 source 함수를 통해 데이터를 가져와 저장합니다.
   * (항상 JSON 직렬화가 가능한 순수 데이터 형태를 권장합니다)
   */
  async getOrSet<T>(
    config: CacheDefinition,
    source: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await this.get<T>(config);
      if (cached !== null) return cached;
    } catch (e) {
      this.logger.warn(`Cache read failed: ${config.key}`);
    }

    const value = await source();

    try {
      await this.set(config, value);
    } catch (e) {
      this.logger.warn(`Cache write failed: ${config.key}`);
    }

    return value;
  }

  async get<T>(config: CacheDefinition): Promise<T | null> {
    const { key, store } = config;
    if (store === CacheStore.MEMORY) {
      const entry = this.memoryCache.get(key);
      if (!entry || Date.now() > entry.expiry) return null;
      return entry.value as T;
    }
    return await this.redisService.get<T>(key);
  }

  async set<T>(config: CacheDefinition, value: T): Promise<void> {
    const { key, ttlSeconds, store } = config;
    if (store === CacheStore.MEMORY) {
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000,
      });
      return;
    }
    await this.redisService.set(key, value, ttlSeconds);
  }

  async del(config: CacheDefinition): Promise<void> {
    if (config.store === CacheStore.MEMORY) {
      this.memoryCache.delete(config.key);
    } else {
      await this.redisService.del(config.key);
    }
  }
}
