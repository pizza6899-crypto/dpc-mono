---
name: scheduler-implementation
description: NestJS 스케줄러(Cron Job) 구현 가이드 및 모범 사례 (Table-based GlobalLock 포함)
---

# Scheduler Implementation Expert

## Overview
이 스킬은 NestJS 환경에서 안정적이고 확장 가능한 스케줄러(Cron Job)를 구현하기 위한 가이드라인을 제공합니다. 특히 커넥션 풀을 사용하는 다중 인스턴스 환경에서 발생할 수 있는 중복 실행 문제를 방지하기 위해 **GlobalLock 테이블 기반의 분산 락** 메커니즘을 표준으로 사용합니다.

## Instructions

### 1. 기본 구조 (Basic Structure)
스케줄러 클래스는 `@Injectable()` 데코레이터를 사용하며, 독립적인 `schedulers` 디렉토리에 위치시킵니다.

```typescript
// 예: src/modules/[module-name]/schedulers/[task-name].scheduler.ts
@Injectable()
export class TaskScheduler {
  private readonly logger = new Logger(TaskScheduler.name);

  constructor(
    private readonly taskService: TaskService,
    private readonly envService: EnvService,
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}
}
```

### 2. 동시성 제어 전략 (GlobalLock)

비즈니스 로직의 데이터 정합성은 `pg_advisory_xact_lock`으로 보호하되, 스케줄러 인스턴스 자체의 중복 실행 방지 및 이력 관리는 `GlobalLock` 테이블을 사용합니다.

1.  **원자적 선점**: `UPDATE` 쿼리의 `WHERE` 절에서 `is_acquired = false` 조건을 사용하여 원자적으로 락을 획득합니다.
2.  **Zombie Lock 회수**: 설정된 `timeout_seconds`가 지난 락은 서버 장애로 간주하고 자동으로 회수할 수 있게 설계합니다.
3.  **이력 관리**: 실행 결과(SUCCESS/FAILED)와 마지막 실행 시간을 기록하여 운영 지표로 활용합니다.

### 3. 표준 템플릿 (Standard Template)

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async handleTask() {
  await this.cls.run(async () => {
    if (!this.envService.scheduler.enabled) return;

    const lockKey = 'scheduler:task-name';
    const instanceId = process.env.HOSTNAME || 'unknown';

    // 1. 락 선점 시도
    const result = await this.prisma.$executeRaw`
      UPDATE "global_locks"
      SET "is_acquired" = true,
          "locked_at" = NOW(),
          "instance_id" = ${instanceId}
      WHERE "key" = ${lockKey}
        AND (
          "is_acquired" = false 
          OR "locked_at" < NOW() - (CAST("timeout_seconds" || ' seconds' AS INTERVAL))
        )
    `;

    if (result === 0) return; // 입구 컷

    try {
      this.logger.log('작업 시작');
      await this.taskService.execute();
      
      // 2. 성공 기록 및 해제
      await this.prisma.globalLock.update({
        where: { key: lockKey },
        data: {
          isAcquired: false,
          lastResult: 'SUCCESS',
          lastFinishedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('작업 실패', error);
      // 3. 실패 기록 및 해제
      await this.prisma.globalLock.update({
        where: { key: lockKey },
        data: {
          isAcquired: false,
          lastResult: 'FAILED',
          errorMessage: error.message,
          lastFinishedAt: new Date(),
        },
      });
    }
  });
}
```

## References
*   [Concurrency Strategy: Why Table-based?](references/CONCURRENCY.md)
*   [GlobalLock Schema & DDL](references/SCHEMA_DETAILS.md)
