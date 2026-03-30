import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvService } from 'src/common/env/env.service';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly envService: EnvService) {
    this.redisClient = new Redis({
      host: this.envService.redis.host,
      port: this.envService.redis.port,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      connectTimeout: 10000,
      enableOfflineQueue: true,
    });
  }

  getClient(): Redis {
    return this.redisClient;
  }

  // 캐시 조회
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      if (!value) return null;
      return this.deserialize<T>(value);
    } catch (error) {
      this.logger.error(error, `Redis GET 에러: ${key}`);
      return null;
    }
  }

  /**
   * 캐시 조회와 동시에 만료 시간 연장 (Sliding Expiry)
   * Redis 6.2+ GETEX 명령어 활용 (밀리초 단위 PX 사용)
   */
  async getAndExpire<T>(key: string, ttl_sec: number): Promise<T | null> {
    try {
      const ttl_ms = Math.floor(ttl_sec * 1000);
      // @ts-ignore: ioredis may not have latest GETEX typings depending on version
      const value = await this.redisClient.getex(key, 'PX', ttl_ms);
      if (!value) return null;
      return this.deserialize<T>(value);
    } catch (error) {
      this.logger.error(error, `Redis GETEX 에러: ${key}`);
      return null;
    }
  }

  private deserialize<T>(value: string): T {
    return JSON.parse(value, (key, v) => {
      // Date 패턴 (ISO String) 복구
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      if (typeof v === 'string' && isoDatePattern.test(v)) {
        return new Date(v);
      }
      return v;
    }) as T;
  }

  // 캐시에 데이터 저장 (밀리초 단위 PX 사용으로 소수점 TTL 지원)
  async set<T>(key: string, value: T, ttl_sec: number): Promise<boolean> {
    try {
      const serializedValue = this.serialize(value);
      const ttl_ms = ttl_sec * 1000;

      // TTL Jitter: 동시 만료 방지를 위해 랜덤 시간 추가 (밀리초 단위)
      const maxJitterMs = Math.min(ttl_ms * 0.05, 120 * 1000);
      const jitterMs = Math.floor(maxJitterMs * Math.random());

      const finalTtlMs = Math.floor(ttl_ms + jitterMs);
      await this.redisClient.set(key, serializedValue, 'PX', finalTtlMs);
      return true;
    } catch (error) {
      this.logger.error(error, `Redis SET 에러: ${key}`);
      return false;
    }
  }

  // 리스트의 마지막에 데이터 추가
  async rpush<T>(key: string, value: T): Promise<number> {
    try {
      const serializedValue = this.serialize(value);
      return await this.redisClient.rpush(key, serializedValue);
    } catch (error) {
      this.logger.error(error, `Redis RPUSH 에러: ${key}`);
      return 0;
    }
  }

  private serialize<T>(value: T): string {
    return JSON.stringify(value, (_, v) => {
      if (typeof v === 'bigint') return v.toString();
      if (v?.constructor?.name === 'Decimal') return v.toString(); // Prisma.Decimal 대응
      return v;
    });
  }

  // 캐시 삭제
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(error, `Redis DEL 에러: ${key}`);
      return false;
    }
  }

  // 락 관련 메서드들
  async setLock(key: string, value: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redisClient.set(key, value, 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(error, `Redis SET LOCK 에러: ${key}`);
      return false;
    }
  }

  async eval(
    script: string,
    numKeys: number,
    ...args: (string | number)[]
  ): Promise<any> {
    try {
      return await this.redisClient.eval(script, numKeys, ...args);
    } catch (error) {
      this.logger.error(error, `Redis EVAL 에러`);
      throw error;
    }
  }

  // 키 패턴으로 검색
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.error(error, `Redis KEYS 에러: ${pattern}`);
      return [];
    }
  }

  // 원자적 증가
  async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(error, `Redis INCR 에러: ${key}`);
      throw error;
    }
  }

  // 원자적 감소
  async decr(key: string): Promise<number> {
    try {
      return await this.redisClient.decr(key);
    } catch (error) {
      this.logger.error(error, `Redis DECR 에러: ${key}`);
      throw error;
    }
  }

  // 조건부 설정
  async setnx(key: string, value: string): Promise<number> {
    try {
      return await this.redisClient.setnx(key, value);
    } catch (error) {
      this.logger.error(error, `Redis SETNX 에러: ${key}`);
      throw error;
    }
  }

  // TTL과 함께 설정
  async setex(key: string, ttl: number, value: string): Promise<string> {
    try {
      return await this.redisClient.setex(key, ttl, value);
    } catch (error) {
      this.logger.error(error, `Redis SETEX 에러: ${key}`);
      throw error;
    }
  }

  // 키 존재 여부 확인
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(error, `Redis EXISTS 에러: ${key}`);
      return false;
    }
  }

  // 연결 종료 처리
  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis 연결 종료됨');
      } catch (error) {
        // 연결이 이미 닫혀있을 수 있으므로 에러를 무시
        this.logger.warn('Redis 연결 종료 중 에러 발생 (무시됨)');
      }
    }
  }
  async isConnected(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      this.logger.error(error, 'Redis 연결 확인 실패');
      return false;
    }
  }
}
