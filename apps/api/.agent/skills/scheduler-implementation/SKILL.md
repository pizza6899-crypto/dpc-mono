---
name: scheduler-implementation
description: NestJS 스케줄러(Cron Job) 구현 가이드 및 모범 사례 (분산 락, 활성화 제어 포함)
---

# Scheduler Implementation Expert

## Overview
이 스킬은 NestJS 환경에서 안정적이고 확장 가능한 스케줄러(Cron Job)를 구현하기 위한 가이드라인을 제공합니다. 특히 마이크로서비스나 다중 인스턴스 환경에서 발생할 수 있는 중복 실행 문제를 방지하기 위한 분산 락(Global Lock) 처리와 서비스 활성 상태 제어 로직을 포함합니다.

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
    private readonly concurrencyService: ConcurrencyService,
    private readonly cls: ClsService,
  ) {}
}
```

### 2. 구현 가이드라인 (Implementation Checklist)

1.  **활성화 체크**: `this.envService.scheduler.enabled`를 확인하여 스케줄러 실행 여부를 결정합니다.
2.  **분산 락 (Global Lock)**: `concurrencyService.acquireGlobalLock`을 사용하여 다중 인스턴스에서 중복 실행되지 않도록 합니다.
    *   `ttl`: 작업 완료 예상 시간보다 넉넉하게 설정합니다.
    *   `retryCount`: 일반적으로 0으로 설정하여 락 획득 실패 시 즉시 종료합니다.
3.  **CLS 컨텍스트**: `this.cls.run`으로 감싸서 로깅 및 트랜잭션 추적이 용이하도록 합니다.
4.  **비즈니스 로직 분리**: 스케줄러 클래스는 트리거 역할만 수행하고, 실제 작업은 `Application Service`에서 처리합니다.
5.  **예외 처리**: `try...catch...finally` 블록을 사용하여 에러를 로깅하고 최종적으로 락을 해제합니다.

### 3. 표준 템플릿 (Standard Template)

```typescript
@Cron(CronExpression.EVERY_HOUR)
async handleTask() {
  await this.cls.run(async () => {
    // 1. 활성화 상태 확인
    if (!this.envService.scheduler.enabled) {
      return;
    }

    // 2. 글로벌 락 획득
    const lock = await this.concurrencyService.acquireGlobalLock(
      'unique-task-lock-key',
      { ttl: 3600, retryCount: 0 }
    );

    if (!lock) {
      this.logger.debug('Task is already running in another instance.');
      return;
    }

    try {
      this.logger.log('Task started');
      await this.taskService.execute();
      this.logger.log('Task completed');
    } catch (error) {
      this.logger.error('Task failed', error);
    } finally {
      // 3. 락 해제 필수
      await this.concurrencyService.releaseLock(lock);
    }
  });
}
```

## References
*   [NestJS Schedule Documentation](https://docs.nestjs.com/techniques/scheduling)
*   [Concurrency Service Guide](references/CONCURRENCY.md)
*   [Application Service Integration](references/SERVICE_INTEGRATION.md)
