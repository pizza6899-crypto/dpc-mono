import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { NodeIdentityService } from 'src/common/node-identity/node-identity.service';

export interface LockOptions {
  timeoutSeconds?: number;
}

@Injectable()
export class ConcurrencyService {
  private readonly logger = new Logger(ConcurrencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodeIdentityService: NodeIdentityService,
  ) { }

  /**
   * 인스턴스 식별자 (NodeIdentityService의 고유 ID 기반)
   */
  private get instanceId(): string {
    return this.nodeIdentityService.getDisplayId();
  }

  // ========================================================================================================
  // Global Table Lock (작업 제어용)
  // DB 테이블(global_locks)을 사용하며, 트랜잭션과 무관하게 지속될 수 있습니다. (스케줄러 등)
  // ========================================================================================================

  /**
   * [GlobalLock] 락 획득 시도 (테이블 기반)
   * 
   * @param key 락 식별자
   * @param options.timeoutSeconds 좀비 락 자동 회수 시간 (기본값: 1800초)
   */
  async tryAcquire(key: string, options: LockOptions = {}): Promise<boolean> {
    const timeoutSeconds = options.timeoutSeconds ?? 1800;

    try {
      // Prisma Proxy를 거치지 않고 직접 쿼리를 실행하여 트랜잭션 전파 차단
      // clock_timestamp()는 트랜잭션 시작 시간이 아닌 쿼리 실행 시점의 실제 시간을 반환함
      const result = await sql`
        INSERT INTO "global_locks" ("key", "instance_id", "is_acquired", "locked_at", "timeout_seconds", "created_at", "updated_at")
        VALUES (${key}, ${this.instanceId}, true, clock_timestamp(), ${timeoutSeconds}, clock_timestamp(), clock_timestamp())
        ON CONFLICT ("key") DO UPDATE
        SET "is_acquired" = true,
            "locked_at" = clock_timestamp(),
            "instance_id" = ${this.instanceId},
            "timeout_seconds" = ${timeoutSeconds},
            "updated_at" = clock_timestamp(),
            "last_status" = null,
            "error_message" = null
        WHERE "global_locks"."is_acquired" = false 
           OR "global_locks"."locked_at" < clock_timestamp() - ("global_locks"."timeout_seconds" * interval '1 second')
        RETURNING "key"
      `.execute(this.prisma.kysely);

      // INSERT나 UPDATE가 실제로 수행된 경우에만 row가 반환됨 (가장 확실한 방법)
      const success = result.rows.length > 0;

      if (success) {
        this.logger.debug(`락 획득 성공: ${key} (node: ${this.instanceId})`);
      } else {
        this.logger.debug(`락 획득 실패 (이미 점유됨): ${key}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`락 획득 중 오류 발생: ${key}`, error);
      return false;
    }
  }

  /**
   * [GlobalLock] 락 해제 및 결과 기록
   */
  async release(key: string, success: boolean, errorMessage?: string): Promise<void> {
    try {
      // Prisma Proxy API를 사용하여 타입 안전하게 업데이트
      // 소유권 확인: 자기가 잡은 락만 해제할 수 있도록 instanceId 필터링 추가
      const result = await this.prisma.globalLock.updateMany({
        where: {
          key,
          instanceId: this.instanceId,
          isAcquired: true,
        },
        data: {
          isAcquired: false,
          lastResult: success ? 'SUCCESS' : 'FAILED',
          errorMessage: errorMessage ? String(errorMessage).slice(0, 1000) : null,
          lastFinishedAt: new Date(),
        },
      });

      if (result.count === 0) {
        this.logger.warn(`락 해제 실패: 소유권이 없거나 이미 해제됨 (key: ${key}, instance: ${this.instanceId})`);
      } else {
        this.logger.debug(`락 해제 완료: ${key} (${success ? 'SUCCESS' : 'FAILED'})`);
      }
    } catch (error) {
      this.logger.error(`락 해제 중 오류 발생: ${key}`, error);
    }
  }

  /**
   * [Helper] 락 실행 래퍼 함수 (Global Lock 전용)
   */
  async runExclusive(
    key: string,
    task: () => Promise<void>,
    options: LockOptions = {}
  ): Promise<void> {
    const acquired = await this.tryAcquire(key, options);
    if (!acquired) return;

    try {
      await task();
      await this.release(key, true);
    } catch (error) {
      this.logger.error(`작업 실행 중 에러: ${key}`, error);
      await this.release(key, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
