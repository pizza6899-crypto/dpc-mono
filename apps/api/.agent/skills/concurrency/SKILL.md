---
name: concurrency_control
description: Distributed Concurrency Control Guide (Advisory Lock & Global Lock)
---

# Skill: Distributed Concurrency Control

분산 환경(Multi-instance)에서 데이터 무결성을 보장하고 중복 실행을 방지하기 위한 동시성 제어 가이드입니다.

## 🎯 Core Concepts

두 가지 락킹 메커니즘을 제공하며, 목적에 따라 적절한 것을 선택해야 합니다.

| Feature | Advisory Lock (`AdvisoryLockService`) | Global Lock Table (`ConcurrencyService`) |
| :--- | :--- | :--- |
| **Scope** | Transaction Level | Application/Table Level |
| **Duration** | 짧음 (트랜잭션 동안만 유지) | 김 (작업 완료 시까지 유지, 타임아웃 지원) |
| **Implementation** | `pg_advisory_xact_lock` (Session Free) | `INSERT INTO global_locks ...` |
| **Use Case** | 지갑 잔액 수정, 아이템 지급, 재고 차감 등 | 스케줄러(Cron), 대량 데이터 동기화, 리포트 생성 |
| **Blocking** | Blocking (대기함) / Non-blocking (try) | Non-blocking (실패 시 즉시 리턴) |

## 📁 Critical Locations
- **Module:** `apps/api/src/common/concurrency`
- **Namespace:** `apps/api/src/common/concurrency/concurrency.constants.ts`

## 🛠 Usage Guide

### 1. Advisory Lock (Business Logic Safety)

**언제 사용하나?**
- 트랜잭션 내에서 특정 리소스(유저 지갑 등)에 대한 동시 수정을 막아야 할 때.
- 반드시 `Transaction` 컨텍스트 안에서 실행되어야 합니다.

**구현 패턴:**
```typescript
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

@Injectable()
export class WalletService {
  constructor(
    private readonly advisoryLockService: AdvisoryLockService,
    @InjectTransaction() private readonly tx: PrismaTransaction,
  ) {}

  async adjustBalance(userId: bigint, amount: number) {
    // 1. 락 획득 (트랜잭션 시작 직후 권장)
    // 동일한 userId에 대한 다른 트랜잭션은 여기서 대기하게 됨
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_WALLET, 
      userId.toString()
    );

    // 2. 비즈니스 로직 수행
    const wallet = await this.tx.userWallet.findUnique(...);
    // ...
  }
}
```

### 2. Global Lock (Job Scheduling Safety)

**언제 사용하나?**
- 여러 서버 인스턴스 중 **단 한 곳**에서만 실행되어야 하는 작업(스케줄러).
- 트랜잭션과 무관하게(또는 여러 트랜잭션에 걸쳐) 락을 유지해야 할 때.

**구현 패턴 (`runExclusive` 헬퍼 권장):**
```typescript
import { ConcurrencyService } from 'src/common/concurrency';

@Injectable()
export class DailySettlementJob {
  constructor(
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  @Cron('0 0 * * *')
  async handleCron() {
    // 락 키, 실행할 함수, 옵션(타임아웃)
    await this.concurrencyService.runExclusive(
      'scheduler:daily-settlement', 
      async () => {
        this.logger.log('일일 정산 작업 시작...');
        await this.processSettlement();
      },
      { timeoutSeconds: 3600 } // 기본값 1800초 (30분)
    );
  }
}
```

**수동 제어 패턴 (`tryAcquire` + `release`):**
```typescript
const acquired = await this.concurrencyService.tryAcquire('my-job-key', { timeoutSeconds: 60 });
if (!acquired) {
  this.logger.warn('이미 작업이 진행 중입니다.');
  return;
}

try {
  // 작업 수행
} catch (e) {
  // 에러 처리
} finally {
  // 반드시 해제 (성공 여부 전달)
  await this.concurrencyService.release('my-job-key', true);
}
```

## ⚠️ Best Practices

1.  **네임스페이스 관리**: `AdvisoryLock` 사용 시 `concurrency.constants.ts`에 새로운 Enum 값을 정의하여 충돌을 방지하십시오.
2.  **타임아웃 설정**: `GlobalLock` 사용 시 작업의 예상 소요 시간보다 넉넉하게 `timeoutSeconds`를 설정하여, 서버가 죽었을 때 락이 영구적으로 남는 것을 방지하십시오.
3.  **순서 준수**: 데드락 방지를 위해 여러 리소스에 락을 걸 때는 항상 일정한 순서(예: ID 오름차순)로 락을 획득하십시오.
