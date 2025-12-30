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
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(error, `Redis GET 에러: ${key}`);
      return null;
    }
  }

  // 캐시에 데이터 저장
  async set<T>(key: string, value: T, ttl_sec = 30): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const finalTtl = ttl_sec + Math.floor(Math.random() * 10);
      await this.redisClient.set(key, serializedValue, 'EX', finalTtl);
      return true;
    } catch (error) {
      this.logger.error(error, `Redis SET 에러: ${key}`);
      return false;
    }
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
