import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { IdUtil } from '../../utils/id.util';
import { EnvService } from '../env/env.service';

export interface LockOptions {
  ttl?: number; // 락 유지 시간 (초)
  retryCount?: number; // 재시도 횟수
  retryDelay?: number; // 재시도 간격 (밀리초)
}

export interface DistributedLock {
  key: string;
  value: string;
  ttl: number;
}

export interface InstanceLockOptions extends LockOptions {
  instanceId?: string; // 특정 인스턴스 ID (기본값: 현재 인스턴스)
}

@Injectable()
export class ConcurrencyService {
  private readonly logger = new Logger(ConcurrencyService.name);
  private readonly lockPrefix = 'lock:';
  private readonly instanceId: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly envService: EnvService,
  ) {
    const instanceId = this.envService.pm2InstanceNumber;
    this.instanceId = `instance-${instanceId}`;

    this.logger.log(`ConcurrencyService 인스턴스 생성: ${this.instanceId}`);
  }

  /**
   * 사용자 레벨 락 획득
   */
  async acquireUserLock(
    userId: bigint,
    operation: string,
    options: LockOptions = {},
  ): Promise<DistributedLock | null> {
    const { ttl = 30, retryCount = 3, retryDelay = 100 } = options;
    const lockKey = `${this.lockPrefix}user:${userId}:${operation}`;
    const lockValue = this.generateLockValue();

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // RedisService의 setLock 메서드 사용
        const success = await this.redisService.setLock(
          lockKey,
          lockValue,
          ttl,
        );

        if (success) {
          this.logger.debug(`락 획득 성공: ${lockKey}`);
          return {
            key: lockKey,
            value: lockValue,
            ttl,
          };
        }

        if (attempt < retryCount) {
          this.logger.debug(
            `락 획득 실패, 재시도 중: ${lockKey} (${attempt + 1}/${retryCount})`,
          );
          await this.sleep(retryDelay);
        }
      } catch (error) {
        this.logger.error(error, `락 획득 중 오류: ${lockKey}`);
        if (attempt === retryCount) throw error;
      }
    }

    this.logger.warn(`락 획득 실패: ${lockKey} (최대 재시도 횟수 초과)`);
    return null;
  }

  /**
   * 인스턴스 레벨 락 획득
   */
  async acquireInstanceLock(
    operation: string,
    options: InstanceLockOptions = {},
  ): Promise<DistributedLock | null> {
    const { ttl = 60, retryCount = 5, retryDelay = 200, instanceId } = options;
    const targetInstanceId = instanceId || this.instanceId;
    const lockKey = `${this.lockPrefix}instance:${targetInstanceId}:${operation}`;
    const lockValue = this.generateLockValue();

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const success = await this.redisService.setLock(
          lockKey,
          lockValue,
          ttl,
        );

        if (success) {
          this.logger.debug(`인스턴스 락 획득 성공: ${lockKey}`);
          return {
            key: lockKey,
            value: lockValue,
            ttl,
          };
        }

        if (attempt < retryCount) {
          this.logger.debug(
            `인스턴스 락 획득 실패, 재시도 중: ${lockKey} (${attempt + 1}/${retryCount})`,
          );
          await this.sleep(retryDelay);
        }
      } catch (error) {
        this.logger.error(error, `인스턴스 락 획득 중 오류: ${lockKey}`);
        if (attempt === retryCount) throw error;
      }
    }

    this.logger.warn(
      `인스턴스 락 획득 실패: ${lockKey} (최대 재시도 횟수 초과)`,
    );
    return null;
  }

  /**
   * 글로벌 락 획득 (모든 인스턴스에서 공유)
   */
  async acquireGlobalLock(
    operation: string,
    options: LockOptions = {},
  ): Promise<DistributedLock | null> {
    const { ttl = 120, retryCount = 10, retryDelay = 500 } = options;
    const lockKey = `${this.lockPrefix}global:${operation}`;
    const lockValue = this.generateLockValue();

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const success = await this.redisService.setLock(
          lockKey,
          lockValue,
          ttl,
        );

        if (success) {
          this.logger.debug(`글로벌 락 획득 성공: ${lockKey}`);
          return {
            key: lockKey,
            value: lockValue,
            ttl,
          };
        }

        if (attempt < retryCount) {
          this.logger.debug(
            `글로벌 락 획득 실패, 재시도 중: ${lockKey} (${attempt + 1}/${retryCount})`,
          );
          await this.sleep(retryDelay);
        }
      } catch (error) {
        this.logger.error(error, `글로벌 락 획득 중 오류: ${lockKey}`);
        if (attempt === retryCount) throw error;
      }
    }

    this.logger.warn(`글로벌 락 획득 실패: ${lockKey} (최대 재시도 횟수 초과)`);
    return null;
  }

  /**
   * 락 해제
   */
  async releaseLock(lock: DistributedLock): Promise<boolean> {
    try {
      // Lua 스크립트로 원자적 락 해제
      const script = `
        local current = redis.call("get", KEYS[1])
        if current == false then
            return 0  -- 키가 존재하지 않음
        elseif current == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return -1  -- 소유권 없음
        end`;

      const result = await this.redisService.eval(
        script,
        1,
        lock.key,
        lock.value,
      );

      if (result === 1) {
        this.logger.debug(`락 해제 성공: ${lock.key}`);
        return true;
      } else if (result === 0) {
        this.logger.warn(`락이 이미 만료됨: ${lock.key}`);
        return false;
      } else {
        this.logger.warn(`락 해제 실패 (소유권 없음): ${lock.key}`);
        return false;
      }
    } catch (error) {
      this.logger.error(error, `락 해제 중 오류: ${lock.key}`);
      return false;
    }
  }

  /**
   * 사용자 락 자동 해제를 위한 래퍼 함수
   */
  async withUserLock<T>({
    userId,
    operation,
    callback,
    options = { ttl: 30, retryCount: 10, retryDelay: 100 },
  }: {
    userId: bigint;
    operation: string;
    callback: () => Promise<T>;
    options?: LockOptions;
  }): Promise<T> {
    const { ttl = 30, retryCount = 10, retryDelay = 100 } = options;

    // 락 획득까지 대기
    let lock: DistributedLock | null = null;
    let attempts = 0;

    while (!lock && attempts < retryCount) {
      lock = await this.acquireUserLock(userId, operation, {
        ttl,
        retryCount: 0,
      });

      if (!lock) {
        attempts++;
        if (attempts < retryCount) {
          this.logger.debug(
            `락 대기 중: ${userId} - ${operation} (${attempts}/${retryCount})`,
          );
          await this.sleep(retryDelay);
        }
      }
    }

    if (!lock) {
      throw new Error(`사용자 락 획득 실패: ${userId} - ${operation}`);
    }

    try {
      const result = await callback();
      return result;
    } finally {
      await this.releaseLock(lock);
    }
  }

  /**
   * 인스턴스 락 래퍼 함수
   */
  async withInstanceLock<T>(
    operation: string,
    callback: () => Promise<T>,
    options: InstanceLockOptions = {},
  ): Promise<T> {
    const lock = await this.acquireInstanceLock(operation, options);

    if (!lock) {
      throw new Error(`인스턴스 락 획득 실패: ${operation}`);
    }

    try {
      const result = await callback();
      return result;
    } finally {
      await this.releaseLock(lock);
    }
  }

  /**
   * 글로벌 락 래퍼 함수
   */
  async withGlobalLock<T>(
    operation: string,
    callback: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    const lock = await this.acquireGlobalLock(operation, options);

    if (!lock) {
      return null as any;
    }

    try {
      const result = await callback();
      return result;
    } finally {
      await this.releaseLock(lock);
    }
  }

  /**
   * 특정 인스턴스 락 래퍼 함수
   */
  async withSpecificInstanceLock<T>(
    instanceId: string,
    operation: string,
    callback: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    return this.withInstanceLock(operation, callback, {
      ...options,
      instanceId,
    });
  }

  /**
   * 사용자 잔액 동시성 제어
   */
  async withUserBalanceLock<T>(
    userId: bigint,
    callback: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    return this.withUserLock({
      userId,
      operation: 'balance',
      callback,
      options,
    });
  }

  /**
   * 사용자 프로필 동시성 제어
   */
  async withUserProfileLock<T>(
    userId: bigint,
    callback: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    return this.withUserLock({
      userId,
      operation: 'profile',
      callback,
      options,
    });
  }

  /**
   * 사용자 인증 동시성 제어
   */
  async withUserAuthLock<T>(
    userId: bigint,
    callback: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    return this.withUserLock({ userId, operation: 'auth', callback, options });
  }

  /**
   * 락 상태 확인
   */
  async isLocked(userId: string, operation: string): Promise<boolean> {
    const lockKey = `${this.lockPrefix}user:${userId}:${operation}`;
    return await this.redisService.exists(lockKey);
  }

  /**
   * 인스턴스 락 상태 확인
   */
  async isInstanceLocked(
    operation: string,
    instanceId?: string,
  ): Promise<boolean> {
    const targetInstanceId = instanceId || this.instanceId;
    const lockKey = `${this.lockPrefix}instance:${targetInstanceId}:${operation}`;
    return await this.redisService.exists(lockKey);
  }

  /**
   * 글로벌 락 상태 확인
   */
  async isGlobalLocked(operation: string): Promise<boolean> {
    const lockKey = `${this.lockPrefix}global:${operation}`;
    return await this.redisService.exists(lockKey);
  }

  /**
   * 모든 사용자 락 해제 (관리자용)
   */
  async releaseAllUserLocks(userId: string): Promise<number> {
    const pattern = `${this.lockPrefix}user:${userId}:*`;
    const keys = await this.redisService.keys(pattern);

    if (keys.length > 0) {
      let releasedCount = 0;
      for (const key of keys) {
        const success = await this.redisService.del(key);
        if (success) releasedCount++;
      }
      this.logger.log(`사용자 ${userId}의 모든 락 해제: ${releasedCount}개`);
      return releasedCount;
    }

    return 0;
  }

  /**
   * 현재 인스턴스의 모든 락 해제
   */
  async releaseAllInstanceLocks(): Promise<number> {
    const pattern = `${this.lockPrefix}instance:${this.instanceId}:*`;
    const keys = await this.redisService.keys(pattern);

    if (keys.length > 0) {
      let releasedCount = 0;
      for (const key of keys) {
        const success = await this.redisService.del(key);
        if (success) releasedCount++;
      }
      this.logger.log(
        `인스턴스 ${this.instanceId}의 모든 락 해제: ${releasedCount}개`,
      );
      return releasedCount;
    }

    return 0;
  }

  /**
   * 특정 인스턴스의 모든 락 해제 (관리자용)
   */
  async releaseAllLocksForInstance(instanceId: string): Promise<number> {
    const pattern = `${this.lockPrefix}instance:${instanceId}:*`;
    const keys = await this.redisService.keys(pattern);

    if (keys.length > 0) {
      let releasedCount = 0;
      for (const key of keys) {
        const success = await this.redisService.del(key);
        if (success) releasedCount++;
      }
      this.logger.log(
        `인스턴스 ${instanceId}의 모든 락 해제: ${releasedCount}개`,
      );
      return releasedCount;
    }

    return 0;
  }

  /**
   * 모든 글로벌 락 해제 (관리자용)
   */
  async releaseAllGlobalLocks(): Promise<number> {
    const pattern = `${this.lockPrefix}global:*`;
    const keys = await this.redisService.keys(pattern);

    if (keys.length > 0) {
      let releasedCount = 0;
      for (const key of keys) {
        const success = await this.redisService.del(key);
        if (success) releasedCount++;
      }
      this.logger.log(`모든 글로벌 락 해제: ${releasedCount}개`);
      return releasedCount;
    }

    return 0;
  }

  /**
   * 락 통계 정보 (인스턴스 정보 포함)
   */
  async getLockStats(): Promise<{
    totalLocks: number;
    userLocks: number;
    instanceLocks: number;
    globalLocks: number;
    currentInstanceLocks: number;
    balanceLocks: number;
    profileLocks: number;
    authLocks: number;
  }> {
    const allLocks = await this.redisService.keys(`${this.lockPrefix}*`);
    const userLocks = await this.redisService.keys(`${this.lockPrefix}user:*`);
    const instanceLocks = await this.redisService.keys(
      `${this.lockPrefix}instance:*`,
    );
    const globalLocks = await this.redisService.keys(
      `${this.lockPrefix}global:*`,
    );
    const currentInstanceLocks = await this.redisService.keys(
      `${this.lockPrefix}instance:${this.instanceId}:*`,
    );
    const balanceLocks = await this.redisService.keys(
      `${this.lockPrefix}user:*:balance`,
    );
    const profileLocks = await this.redisService.keys(
      `${this.lockPrefix}user:*:profile`,
    );
    const authLocks = await this.redisService.keys(
      `${this.lockPrefix}user:*:auth`,
    );

    return {
      totalLocks: allLocks.length,
      userLocks: userLocks.length,
      instanceLocks: instanceLocks.length,
      globalLocks: globalLocks.length,
      currentInstanceLocks: currentInstanceLocks.length,
      balanceLocks: balanceLocks.length,
      profileLocks: profileLocks.length,
      authLocks: authLocks.length,
    };
  }

  /**
   * 현재 인스턴스 ID 반환
   */
  getCurrentInstanceId(): string {
    return this.instanceId;
  }

  private generateLockValue(): string {
    return IdUtil.generateCuid();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
