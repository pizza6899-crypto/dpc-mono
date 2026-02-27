// src/platform/throttle/throttle.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import {
  ThrottleOptions,
  ThrottleResult,
  ThrottleScope,
} from './types/throttle.types';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class ThrottleService {
  private readonly logger = new Logger(ThrottleService.name);
  private readonly keyPrefix = 'throttle:';

  constructor(private readonly redisService: RedisService) { }

  /**
   * 요청 쓰로틀링 체크 및 카운트 증가
   */
  async checkAndIncrement(
    key: string,
    options: ThrottleOptions,
  ): Promise<ThrottleResult> {
    const fullKey = `${this.keyPrefix}${key}`;

    try {
      // Redis에서 현재 카운트 조회 및 증가 (원자적 연산)
      const count = await this.redisService.incr(fullKey);

      // TTL이 없으면 설정 (expire는 값에 영향 없음)
      let ttl = await this.redisService.getClient().ttl(fullKey);
      if (ttl === -1) {
        await this.redisService.getClient().expire(fullKey, options.ttl);
        ttl = options.ttl; // expire 후에는 설정한 값 사용
      }

      const resetTime =
        Math.floor(nowUtc().getTime() / 1000) + (ttl > 0 ? ttl : options.ttl);
      const allowed = count <= options.limit;
      const remaining = Math.max(0, options.limit - count);

      if (!allowed) {
        this.logger.warn(
          `쓰로틀링 제한 초과: ${key} (${count}/${options.limit})`,
        );
      }

      return {
        allowed,
        limit: options.limit,
        remaining,
        resetTime,
        retryAfter: !allowed && ttl > 0 ? ttl : undefined,
      };
    } catch (error) {
      this.logger.error(error, `쓰로틀링 체크 중 오류: ${key}`);

      // Redis 오류 시 요청 허용 (fail-open 방식)
      return {
        allowed: true,
        limit: options.limit,
        remaining: options.limit,
        resetTime: Math.floor(nowUtc().getTime() / 1000) + options.ttl,
      };
    }
  }

  /**
   * 요청 쓰로틀링 체크만 수행 (카운트 증가 X)
   */
  async checkLimit(
    key: string,
    options: ThrottleOptions,
  ): Promise<ThrottleResult> {
    const fullKey = `${this.keyPrefix}${key}`;

    try {
      const count = await this.getCurrentCount(key);
      const ttl = await this.getTtl(key);

      const resetTime =
        Math.floor(nowUtc().getTime() / 1000) + (ttl > 0 ? ttl : options.ttl);
      const allowed = count < options.limit; // 다음번 증가 시 limit을 넘지 않아야 함
      const remaining = Math.max(0, options.limit - count);

      return {
        allowed,
        limit: options.limit,
        remaining,
        resetTime,
        retryAfter: !allowed && ttl > 0 ? ttl : undefined,
      };
    } catch (error) {
      this.logger.error(error, `쓰로틀링 체크 중 오류: ${key}`);
      return {
        allowed: true,
        limit: options.limit,
        remaining: options.limit,
        resetTime: Math.floor(nowUtc().getTime() / 1000) + options.ttl,
      };
    }
  }

  /**
   * 키 생성 헬퍼 메서드
   */
  generateKey(
    request: Request,
    scope: ThrottleScope,
    customKeyGenerator?: (req: Request) => string,
  ): string {
    switch (scope) {
      case ThrottleScope.IP:
        return this.getIpKey(request);
      case ThrottleScope.USER:
        return this.getUserKey(request);
      case ThrottleScope.GLOBAL:
        return this.getGlobalKey(request);
      case ThrottleScope.CUSTOM:
        return customKeyGenerator
          ? customKeyGenerator(request)
          : this.getIpKey(request);
      default:
        return this.getIpKey(request);
    }
  }

  /**
   * IP 기반 키 생성
   */
  private getIpKey(request: Request): string {
    const ip =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.socket.remoteAddress ||
      'unknown';
    const path = request.path;
    const method = request.method.toLowerCase();
    return `ip:${ip}:${method}:${path}`;
  }

  /**
   * 사용자 기반 키 생성
   */
  private getUserKey(request: Request): string {
    const userId = (request.user as any)?.id || 'anonymous';
    const path = request.path;
    const method = request.method.toLowerCase();
    return `user:${userId}:${method}:${path}`;
  }

  /**
   * 전역 키 생성
   */
  private getGlobalKey(request: Request): string {
    const path = request.path;
    const method = request.method.toLowerCase();
    return `global:${method}:${path}`;
  }

  /**
   * 특정 키의 현재 카운트 조회 (디버깅/모니터링용)
   */
  async getCurrentCount(key: string): Promise<number> {
    const fullKey = `${this.keyPrefix}${key}`;
    try {
      const value = await this.redisService.getClient().get(fullKey);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      this.logger.error(error, `카운트 조회 중 오류: ${key}`);
      return 0;
    }
  }

  /**
   * 특정 키의 TTL 조회
   */
  async getTtl(key: string): Promise<number> {
    const fullKey = `${this.keyPrefix}${key}`;
    try {
      return await this.redisService.getClient().ttl(fullKey);
    } catch (error) {
      this.logger.error(error, `TTL 조회 중 오류: ${key}`);
      return -1;
    }
  }

  /**
   * 특정 키 리셋 (관리자용)
   */
  async resetKey(key: string): Promise<boolean> {
    const fullKey = `${this.keyPrefix}${key}`;
    try {
      return await this.redisService.del(fullKey);
    } catch (error) {
      this.logger.error(error, `키 리셋 중 오류: ${key}`);
      return false;
    }
  }

  /**
   * 패턴으로 키 삭제 (관리자용)
   */
  async resetKeysByPattern(pattern: string): Promise<number> {
    const fullPattern = `${this.keyPrefix}${pattern}`;
    try {
      const keys = await this.redisService.keys(fullPattern);
      let deletedCount = 0;

      for (const key of keys) {
        const success = await this.redisService.del(key);
        if (success) deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(error, `패턴 키 삭제 중 오류: ${pattern}`);
      return 0;
    }
  }
}
