# Scheduler Implementation Standard

> **[IMPORTANT]** 
> 프로젝트의 모든 예약 작업(Cron) 및 스케줄러는 이제 **BullMQ Repeatable Jobs**를 통해 구현하는 것을 원칙으로 합니다. 
> 상세한 구현 방법은 [BullMQ Worker Standard](../bullmq-worker-standard/SKILL.md)를 참조하십시오.

---

## 1. 개요
기존의 NestJS `@Cron` 및 `GlobalLock` 테이블 기반 스케줄러는 BullMQ 인프라로 통합되었습니다. 
더 이상 새로운 모듈에서 `GlobalLock` 기반의 스케줄러를 생성하지 마십시오.

## 2. BullMQ 전환 이점
1.  **신뢰성**: 분산 환경에서 단일 실행 보장이 BullMQ 레벨에서 완벽하게 지원됩니다.
2.  **가시성**: BullBoard를 통해 예약된 작업 목록과 다음 실행 시간을 시각적으로 확인하고 제어할 수 있습니다.
3.  **유연성**: 서버 코드 수정 없이 Redis 상의 Job만 제거하거나 수정하여 스케줄을 변경할 수 있습니다.
4.  **장애 복구**: 작업 실패 시 감사 로그 연동 및 재시도 정책이 자동으로 적용됩니다.

## 3. 레거시 로직 (Legacy / Special Cases Only)
어떤 이유로든 BullMQ를 사용할 수 없는 특수한 환경이거나, 기존 코드를 유지보수해야 하는 경우에만 아래의 `GlobalLock` 방식을 참조하십시오.

### 3.1. 동시성 제어 전략 (GlobalLock)
다중 인스턴스 환경에서 중복 실행 방지를 위해 **GlobalLock 테이블 기반의 분산 락**을 사용합니다.
1.  **원자적 선점**: `UPDATE` 쿼리의 `WHERE` 절에서 `is_acquired = false` 조건을 사용합니다.
2.  **Zombie Lock 회수**: 설정된 `timeout_seconds`가 지난 락은 자동으로 회수합니다.

```typescript
// Legacy Template
@Cron(CronExpression.EVERY_5_MINUTES)
async handleTask() {
  await this.cls.run(async () => {
    const lockKey = 'scheduler:old-task';
    const result = await this.prisma.$executeRaw`
      UPDATE "global_locks"
      SET "is_acquired" = true, "locked_at" = NOW()
      WHERE "key" = ${lockKey} AND "is_acquired" = false
    `;
    if (result === 0) return;
    try {
      await this.taskService.execute();
      await this.prisma.globalLock.update({ where: { key: lockKey }, data: { isAcquired: false, lastResult: 'SUCCESS' } });
    } catch (error) {
      await this.prisma.globalLock.update({ where: { key: lockKey }, data: { isAcquired: false, lastResult: 'FAILED' } });
    }
  });
}
```

## References
*   [BullMQ Worker Standard](../bullmq-worker-standard/SKILL.md)
*   [Legacy Concurrency Strategy: Why Table-based?](references/CONCURRENCY.md)
