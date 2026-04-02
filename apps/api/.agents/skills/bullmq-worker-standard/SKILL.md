# BullMQ Worker Implementation Standard

## Overview
이 스킬은 프로젝트의 비동기 작업 및 예약 작업(Cron) 처리를 담당하는 **BullMQ Worker(프로세서)**를 구현하기 위한 표준 가이드라인을 제공합니다. 
분산 환경에서의 확장성과 유지보수성을 위해 **도메인 중심의 분산 설정(Decentralized Ownership)**과 **중앙 레지스트리(Central Registry)** 구조를 따릅니다.

---

## Instructions

### 1. 설계 원칙: "Decentralized Ownership"
각 도메인 모듈은 자신의 큐 설정을 직접 소유하고 관리합니다.
- **도메인 응집도**: 큐 이름, 재시도 정책, 크론 주기 등은 해당 도메인 모듈 내의 `infrastructure/*.bullmq.ts` 파일에 정의합니다.
- **중앙 수집**: 인프라 레이어의 `bullmq.registry.ts`는 각 도메인의 설정을 수집하여 시스템 전체의 큐 목록을 관리합니다.

### 2. 큐 설정 (Queue Configuration)

#### 2.1. 도메인별 설정 정의
새로운 큐를 추가할 때는 도메인 폴더 내에 `<domain>.bullmq.ts` 파일을 생성합니다.
- **타임존**: 글로벌 기본 타임존(`BULLMQ_DEFAULT_TIMEZONE`)이 자동으로 적용되므로, 특수한 경우가 아니면 `tz` 설정을 생략합니다.

```typescript
// src/modules/my-domain/infrastructure/my-domain.bullmq.ts
import { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const MY_DOMAIN_QUEUES = {
    MY_JOB: {
        name: 'my-domain-specific-task',
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: 1000,
            removeOnFail: 5000,
        },
        workerOptions: { concurrency: 5 },
        repeatableJobs: [
            {
                name: 'my-domain-specific-task',
                repeat: { pattern: '0 * * * * *' }, // 타임존 생략 가능 (Asia/Tokyo 기본 적용)
            },
        ],
    },
} as const satisfies Record<string, QueueConfig>;
```

#### 2.2. 중앙 레지스트리 등록
정의한 설정을 `src/infrastructure/bullmq/bullmq.registry.ts`에 추가하여 스케줄러가 인식할 수 있게 합니다.

```typescript
// src/infrastructure/bullmq/bullmq.registry.ts
import { MY_DOMAIN_QUEUES } from 'src/modules/my-domain/infrastructure/my-domain.bullmq';

export const BULLMQ_REGISTRY = {
    // ... 기존 설정들
    MY_DOMAIN: MY_DOMAIN_QUEUES,
} as const;
```

### 3. 표준 프로세서 구현
모든 Worker 클래스는 반드시 **`BaseProcessor`**를 상속받아야 하며, 도메인 로컬 상수를 통해 설정을 주입받습니다.

```typescript
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { MY_DOMAIN_QUEUES } from '../infrastructure/my-domain.bullmq';
import { ClsService } from 'nestjs-cls';

// 1. 설정 가져오기 (도메인 로컬 상수 참조)
const queueConfig = getQueueConfig(MY_DOMAIN_QUEUES.MY_JOB);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class MyJobProcessor extends BaseProcessor<MyJobData, void> {
    constructor(protected readonly cls: ClsService) {
        super();
    }

    protected async processJob(job: Job<MyJobData>): Promise<void> {
        // 비즈니스 로직 처리
    }
}
```

### 4. 주요 메커니즘

#### 4.1. 커넥션 분리 (Producer vs Consumer)
- **Producer (인큐)**: 기본 Redis 커넥션을 사용하여 작업을 생성합니다.
- **Consumer (워커)**: `getQueueConfig()`를 통해 자동으로 `'WORKER'` 전용 커넥션 풀을 사용하도록 설정됩니다.

- 패턴(Cron)이나 타임존이 변경된 경우에만 삭제 후 재등록하여 멱등성을 유지합니다.

#### 4.3. Job ID 작명 규칙 및 중복 방지 (Deduplication)
분산 환경에서 동일한 작업이 중복 생성되는 것을 막기 위해 `jobId`를 명시적으로 부여할 수 있습니다.
- **콜론(:) 사용 금지 (중요)**: BullMQ v5+ 부터 **사용자 정의 `jobId`에 콜론(`:`)을 포함할 수 없습니다.** 콜론은 BullMQ 내부 구분자로 사용되므로, 대신 하이픈(`-`)을 사용하십시오.
- **조합 패턴**: `[동작]-[대상ID]-[날짜/시간키]` 형식을 권장합니다.
  - ✅ Good: `eval-user-123-20240225`
  - ❌ Bad: `eval:user:123:20240225` (런타임 에러 발생)

### 5. 주의사항 (Critical)
1. **하드코딩 금지**: 큐 이름은 항상 도메인 상수(`*.bullmq.ts`)를 참조하십시오.
2. **`jobId` 내 콜론 사용 금지**: `Custom Id cannot contain :` 에러 방지를 위해 반드시 하이픈(`-`)을 사용하십시오.
3. **순환 참조 주의**: `bullmq.registry.ts`는 도메인을 참조하지만, 도메인 파일은 `bullmq.registry.ts`를 참조해서는 안 됩니다.
4. **`BaseProcessor` 필수 사용**: 에러 핸들링, 로깅, 트랜잭션 전파를 위해 필수입니다.
5. **가벼운 Job Data**: `job.data`에는 최소한의 ID만 담고 자세한 정보는 프로세서 내부에서 DB를 조회하십시오.
