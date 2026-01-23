import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { PrismaTransactionalAdapter } from 'src/infrastructure/prisma/prisma.module';
import { NodeIdentityService } from 'src/common/node-identity/node-identity.service';

export interface LockOptions {
  timeoutSeconds?: number;
}

@Injectable()
export class ConcurrencyService {
  private readonly logger = new Logger(ConcurrencyService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<PrismaTransactionalAdapter>,
    private readonly nodeIdentityService: NodeIdentityService,
  ) { }

  /**
   * 인스턴스 식별자 (NodeIdentityService의 고유 ID 기반)
   */
  private get instanceId(): string {
    return this.nodeIdentityService.getDisplayId();
  }

  /**
   * [GlobalLock] 락 획득 시도 (테이블 기반)
   * 
   * @param key 락 식별자
   * @param options.timeoutSeconds 좀비 락 자동 회수 시간 (기본값: 1800초)
   */
  async tryAcquire(key: string, options: LockOptions = {}): Promise<boolean> {
    const timeoutSeconds = options.timeoutSeconds ?? 1800;

    try {
      // Prisma Proxy를 통한 원자적 락 선점
      const result = await this.tx.$executeRaw`
        INSERT INTO "global_locks" ("key", "instance_id", "is_acquired", "locked_at", "timeout_seconds", "created_at", "updated_at")
        VALUES (${key}, ${this.instanceId}, true, NOW(), ${timeoutSeconds}, NOW(), NOW())
        ON CONFLICT ("key") DO UPDATE
        SET "is_acquired" = true,
            "locked_at" = NOW(),
            "instance_id" = ${this.instanceId},
            "timeout_seconds" = ${timeoutSeconds},
            "updated_at" = NOW(),
            "last_status" = null,
            "error_message" = null
        WHERE "global_locks"."is_acquired" = false 
           OR "global_locks"."locked_at" < NOW() - (CAST(${timeoutSeconds} || ' seconds' AS INTERVAL))
      `;

      const success = Number(result) > 0;

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
      await (this.tx as any).globalLock.update({
        where: { key },
        data: {
          isAcquired: false,
          lastResult: success ? 'SUCCESS' : 'FAILED',
          errorMessage: errorMessage ? String(errorMessage).slice(0, 1000) : null,
          lastFinishedAt: new Date(),
        },
      });

      this.logger.debug(`락 해제 완료: ${key} (${success ? 'SUCCESS' : 'FAILED'})`);
    } catch (error) {
      this.logger.error(`락 해제 중 오류 발생: ${key}`, error);
    }
  }

  /**
   * [Helper] 락 실행 래퍼 함수
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
