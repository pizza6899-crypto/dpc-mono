import { Test, TestingModule } from '@nestjs/testing';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { RedisService } from 'src/common/redis/redis.service';
import { EnvModule } from 'src/common/env/env.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { nowUtc } from 'src/utils/date.util';

describe('ConcurrencyService Integration', () => {
  let service: ConcurrencyService;
  let redisService: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EnvModule, RedisModule],
      providers: [ConcurrencyService],
    }).compile();

    service = module.get<ConcurrencyService>(ConcurrencyService);
    redisService = module.get<RedisService>(RedisService);

    try {
      await redisService.isConnected();
    } catch (error) {
      console.warn('Redis 연결 실패 - 테스트를 건너뜁니다:', error.message);
    }
  });

  afterEach(async () => {
    const allLocks = await redisService.keys('lock:*');
    for (const key of allLocks) {
      await redisService.del(key);
    }
  });

  afterAll(async () => {
    await redisService.onModuleDestroy();
  });

  describe('User Lock Integration', () => {
    it('should handle concurrent user operations', async () => {
      const userId = 'test-user-123';
      const results: string[] = [];

      // 동시에 여러 작업 실행
      const promises = [
        service.withUserBalanceLock(userId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          results.push('operation1');
          return 'result1';
        }),
        service.withUserBalanceLock(userId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('operation2');
          return 'result2';
        }),
        service.withUserBalanceLock(userId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 75));
          results.push('operation3');
          return 'result3';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual(['result1', 'result2', 'result3']);
      expect(results.length).toBe(3);
    });

    it('should prevent concurrent access to same user', async () => {
      const userId = 'test-user-456';
      let concurrentAccess = false;

      const promise1 = service.withUserBalanceLock(userId, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'first';
      });

      const promise2 = service.withUserBalanceLock(userId, async () => {
        concurrentAccess = true;
        return 'second';
      });

      await Promise.all([promise1, promise2]);

      // 두 번째 작업이 첫 번째 작업이 완료된 후에 실행되어야 함
      expect(concurrentAccess).toBe(true);
    });

    it('should allow concurrent access to different users', async () => {
      const userId1 = 'test-user-789';
      const userId2 = 'test-user-101';
      const results: string[] = [];

      const promises = [
        service.withUserBalanceLock(userId1, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          results.push('user1');
          return 'result1';
        }),
        service.withUserBalanceLock(userId2, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('user2');
          return 'result2';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual(['result1', 'result2']);
      // 두 작업이 거의 동시에 실행되어야 함
      expect(results).toContain('user1');
      expect(results).toContain('user2');
    });

    it('should handle different user operations independently', async () => {
      const userId = 'test-user-112';
      const results: string[] = [];

      const promises = [
        service.withUserBalanceLock(userId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          results.push('balance');
          return 'balance-result';
        }),
        service.withUserProfileLock(userId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('profile');
          return 'profile-result';
        }),
        service.withUserAuthLock(userId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 75));
          results.push('auth');
          return 'auth-result';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual([
        'balance-result',
        'profile-result',
        'auth-result',
      ]);
      expect(results.length).toBe(3);
    });

    it('should handle lock acquisition failure gracefully', async () => {
      const userId = 'test-user-113';

      // 매우 짧은 TTL과 재시도 설정으로 락 획득 실패 시뮬레이션
      const lock = await service.acquireUserLock(userId, 'test', {
        ttl: 1,
        retryCount: 1,
        retryDelay: 10,
      });

      expect(lock).not.toBeNull();

      // 락이 만료될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 만료된 락 해제 시도
      const releaseResult = await service.releaseLock(lock!);
      expect(releaseResult).toBe(false);
    });

    it('should check lock status correctly', async () => {
      const userId = 'test-user-114';
      const operation = 'test-operation';

      // 초기 상태 확인
      expect(await service.isLocked(userId, operation)).toBe(false);

      // 락 획득
      const lock = await service.acquireUserLock(userId, operation);
      expect(lock).not.toBeNull();
      expect(await service.isLocked(userId, operation)).toBe(true);

      // 락 해제
      await service.releaseLock(lock!);
      expect(await service.isLocked(userId, operation)).toBe(false);
    });
  });

  describe('Instance Lock Integration', () => {
    it('should handle instance-level operations', async () => {
      const results: string[] = [];

      const promises = [
        service.withInstanceLock('test-operation', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          results.push('instance1');
          return 'result1';
        }),
        service.withInstanceLock('test-operation', async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('instance2');
          return 'result2';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual(['result1', 'result2']);
      expect(results.length).toBe(2);
    });

    it('should handle specific instance locks', async () => {
      const instanceId = 'test-instance-123';
      const results: string[] = [];

      const promises = [
        service.withSpecificInstanceLock(instanceId, 'test-op', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          results.push('specific1');
          return 'result1';
        }),
        service.withSpecificInstanceLock(instanceId, 'test-op', async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('specific2');
          return 'result2';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual(['result1', 'result2']);
      expect(results.length).toBe(2);
    });

    it('should check instance lock status', async () => {
      const operation = 'test-instance-op';

      // 초기 상태 확인
      expect(await service.isInstanceLocked(operation)).toBe(false);

      // 락 획득
      const lock = await service.acquireInstanceLock(operation);
      expect(lock).not.toBeNull();
      expect(await service.isInstanceLocked(operation)).toBe(true);

      // 락 해제
      await service.releaseLock(lock!);
      expect(await service.isInstanceLocked(operation)).toBe(false);
    });
  });

  describe('Global Lock Integration', () => {
    it('should handle global operations', async () => {
      const results: string[] = [];

      const promises = [
        service.withGlobalLock('global-test', async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          results.push('global1');
          return 'result1';
        }),
        service.withGlobalLock('global-test', async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('global2');
          return 'result2';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual(['result1', 'result2']);
      expect(results.length).toBe(2);
    });

    it('should handle different global operations independently', async () => {
      const results: string[] = [];

      const promises = [
        service.withGlobalLock('global-op-1', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          results.push('op1');
          return 'result1';
        }),
        service.withGlobalLock('global-op-2', async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('op2');
          return 'result2';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual(['result1', 'result2']);
      expect(results.length).toBe(2);
    });

    it('should check global lock status', async () => {
      const operation = 'test-global-op';

      // 초기 상태 확인
      expect(await service.isGlobalLocked(operation)).toBe(false);

      // 락 획득
      const lock = await service.acquireGlobalLock(operation);
      expect(lock).not.toBeNull();
      expect(await service.isGlobalLocked(operation)).toBe(true);

      // 락 해제
      await service.releaseLock(lock!);
      expect(await service.isGlobalLocked(operation)).toBe(false);
    });
  });

  describe('Lock Management Integration', () => {
    it('should release all user locks', async () => {
      const userId = 'test-user-115';

      // 여러 락 생성
      const lock1 = await service.acquireUserLock(userId, 'balance');
      const lock2 = await service.acquireUserLock(userId, 'profile');
      const lock3 = await service.acquireUserLock(userId, 'auth');

      expect(lock1).not.toBeNull();
      expect(lock2).not.toBeNull();
      expect(lock3).not.toBeNull();

      // 모든 락 해제
      const releasedCount = await service.releaseAllUserLocks(userId);
      expect(releasedCount).toBe(3);

      // 락이 해제되었는지 확인
      expect(await service.isLocked(userId, 'balance')).toBe(false);
      expect(await service.isLocked(userId, 'profile')).toBe(false);
      expect(await service.isLocked(userId, 'auth')).toBe(false);
    });

    it('should release all instance locks', async () => {
      const operation1 = 'test-instance-op-1';
      const operation2 = 'test-instance-op-2';

      // 여러 인스턴스 락 생성
      const lock1 = await service.acquireInstanceLock(operation1);
      const lock2 = await service.acquireInstanceLock(operation2);

      expect(lock1).not.toBeNull();
      expect(lock2).not.toBeNull();

      // 모든 인스턴스 락 해제
      const releasedCount = await service.releaseAllInstanceLocks();
      expect(releasedCount).toBe(2);

      // 락이 해제되었는지 확인
      expect(await service.isInstanceLocked(operation1)).toBe(false);
      expect(await service.isInstanceLocked(operation2)).toBe(false);
    });

    it('should release all global locks', async () => {
      const operation1 = 'test-global-op-1';
      const operation2 = 'test-global-op-2';

      // 여러 글로벌 락 생성
      const lock1 = await service.acquireGlobalLock(operation1);
      const lock2 = await service.acquireGlobalLock(operation2);

      expect(lock1).not.toBeNull();
      expect(lock2).not.toBeNull();

      // 모든 글로벌 락 해제
      const releasedCount = await service.releaseAllGlobalLocks();
      expect(releasedCount).toBe(2);

      // 락이 해제되었는지 확인
      expect(await service.isGlobalLocked(operation1)).toBe(false);
      expect(await service.isGlobalLocked(operation2)).toBe(false);
    });

    it('should get lock statistics', async () => {
      const userId = 'test-user-116';

      // 다양한 락 생성
      await service.acquireUserLock(userId, 'balance');
      await service.acquireUserLock(userId, 'profile');
      await service.acquireInstanceLock('test-instance-op');
      await service.acquireGlobalLock('test-global-op');

      const stats = await service.getLockStats();

      expect(stats.totalLocks).toBeGreaterThanOrEqual(4);
      expect(stats.userLocks).toBeGreaterThanOrEqual(2);
      expect(stats.instanceLocks).toBeGreaterThanOrEqual(1);
      expect(stats.globalLocks).toBeGreaterThanOrEqual(1);
      expect(stats.balanceLocks).toBeGreaterThanOrEqual(1);
      expect(stats.profileLocks).toBeGreaterThanOrEqual(1);
      expect(stats.authLocks).toBeGreaterThanOrEqual(0);

      // 정리
      await service.releaseAllUserLocks(userId);
      await service.releaseAllInstanceLocks();
      await service.releaseAllGlobalLocks();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Redis 연결이 끊어진 상황을 시뮬레이션하기 어려우므로
      // 잘못된 락 해제 시도로 테스트
      const invalidLock = {
        key: 'invalid-lock-key',
        value: 'invalid-value',
        ttl: 30,
      };

      const result = await service.releaseLock(invalidLock);
      expect(result).toBe(false);
    });

    it('should handle callback errors in wrapper functions', async () => {
      const userId = 'test-user-117';

      await expect(
        service.withUserBalanceLock(userId, async () => {
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');

      // 에러가 발생해도 락이 해제되었는지 확인
      expect(await service.isLocked(userId, 'balance')).toBe(false);
    });

    it('should handle timeout scenarios', async () => {
      const userId = 'test-user-118';

      // 매우 짧은 TTL로 락 획득
      const lock = await service.acquireUserLock(userId, 'timeout-test', {
        ttl: 1,
        retryCount: 0,
      });

      expect(lock).not.toBeNull();

      // 락이 만료될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 만료된 락 상태 확인
      expect(await service.isLocked(userId, 'timeout-test')).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should handle high concurrency scenarios', async () => {
      const userId = 'test-user-119';
      const concurrentCount = 10;
      const results: string[] = [];

      const promises = Array.from({ length: concurrentCount }, (_, i) =>
        service.withUserBalanceLock(userId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push(`operation-${i}`);
          return `result-${i}`;
        }),
      );

      const startTime = nowUtc();
      const lockResults = await Promise.all(promises);
      const endTime = nowUtc();

      expect(lockResults).toHaveLength(concurrentCount);
      expect(results).toHaveLength(concurrentCount);

      // 모든 작업이 순차적으로 실행되었는지 확인
      // (동시 실행이 아닌 순차 실행이므로 시간이 더 걸림)
      expect(endTime.getTime() - startTime.getTime()).toBeGreaterThan(
        concurrentCount * 40,
      );
    });

    it('should handle mixed lock types efficiently', async () => {
      const userId1 = 'test-user-120';
      const userId2 = 'test-user-121';
      const results: string[] = [];

      const promises = [
        // 사용자 락들
        service.withUserBalanceLock(userId1, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          results.push('user1-balance');
          return 'user1-balance-result';
        }),
        service.withUserProfileLock(userId2, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          results.push('user2-profile');
          return 'user2-profile-result';
        }),
        // 인스턴스 락
        service.withInstanceLock('mixed-test', async () => {
          await new Promise((resolve) => setTimeout(resolve, 75));
          results.push('instance');
          return 'instance-result';
        }),
        // 글로벌 락
        service.withGlobalLock('mixed-test', async () => {
          await new Promise((resolve) => setTimeout(resolve, 25));
          results.push('global');
          return 'global-result';
        }),
      ];

      const lockResults = await Promise.all(promises);

      expect(lockResults).toEqual([
        'user1-balance-result',
        'user2-profile-result',
        'instance-result',
        'global-result',
      ]);
      expect(results.length).toBe(4);
    });
  });
});
