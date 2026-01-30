---
name: bullmq-worker-standard
description: BullMQ 프로세서(Worker) 구현 표준 및 인프라 가이드 (BaseProcessor, 큐 설정, 에러 핸들링 포함)
---

# BullMQ Worker Implementation Standard

## Overview
이 스킬은 프로젝트의 비동기 작업 처리를 담당하는 **BullMQ Worker(프로세서)** 를 구현하기 위한 표준 가이드라인을 제공합니다. 
`BaseProcessor` 상속을 통해 안전한 에러 핸들링, 로깅, Graceful Shutdown을 보장하며, `bullmq.constants.ts`를 사용한 중앙 집중식 설정 관리를 원칙으로 합니다.

## Instructions

### 1. 큐 설정 (Queue Configuration)
새로운 큐를 추가할 때는 반드시 `bullmq.constants.ts`에 설정을 정의해야 합니다. **하드코딩된 문자열 사용을 금지합니다.**

```typescript
// src/infrastructure/bullmq/bullmq.constants.ts

export const BULLMQ_QUEUES = {
    MY_DOMAIN: {
        MY_JOB: {
            name: 'my-domain-job', // 큐 이름 (Kebab Case)
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
            workerOptions: { concurrency: 5 }, // 동시 처리 개수
        },
    },
    // ...
} as const;
```

### 2. 표준 프로세서 구현
모든 Worker 클래스는 반드시 **`BaseProcessor`** 를 상속받아야 합니다.

- `getQueueConfig`를 사용하여 옵션을 주입합니다.
- `import type`을 사용하여 인터페이스를 임포트합니다 (`isolatedModules` 호환성).
- 로직은 `processJob` 메서드 안에 구현합니다.

```typescript
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { ClsService } from 'nestjs-cls';

// 1. 설정 가져오기
const queueConfig = getQueueConfig('MY_DOMAIN', 'MY_JOB');

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class MyJobProcessor extends BaseProcessor<MyJobData, void> {
    protected readonly logger = new Logger(MyJobProcessor.name);

    constructor(
        // 필요한 의존성 주입
        protected readonly cls: ClsService, // 필수
    ) {
        super();
    }

    // 2. 비즈니스 로직 구현
    protected async processJob(job: Job<MyJobData>): Promise<void> {
        const { id } = job.data;
        
        // ... 로직 수행 ...
        
        // 실패 시 throw Error (BullMQ가 자동으로 재시도 처리)
        if (!found) {
            throw new Error(`Data not found: ${id} (Retryable)`);
        }
    }
}
```

### 3. 주요 기능 및 규칙

#### 3.1. 에러 핸들링 및 재시도
- **일시적 오류(DB 지연 등):** 반드시 `Error`를 throw하여 BullMQ가 재시도(Retry)하게 해야 합니다.
- **영구적 오류(데이터 손상 등):** 로그를 남기고 정상 종료(return)하거나, 특정 에러 타입을 사용하여 포기시켜야 합니다(Dead Letter Queue).
- **Audit Log:** 에러 발생 시 `BaseProcessor`가 자동으로 Audit Log에 기록합니다. 이때 `job.data`가 너무 크면 자동으로 Truncate 처리됩니다.

#### 3.2. Graceful Shutdown
- `BaseProcessor`가 자동으로 처리하므로 별도의 `OnApplicationShutdown` 구현이 필요 없습니다.
- 워커가 작업 중일 때 종료 신호가 오면 `pause` 후 `close` 과정을 거칩니다.

#### 3.3. Redis 커넥션 최적화
- 모든 워커는 `WORKER`라는 이름의 공유 커넥션을 사용하여 리소스를 절약합니다.
- `queueConfig.workerOptions`를 통해 이 설정이 자동으로 적용됩니다.

### 4. 주의사항 (Critical)
- **`WorkerHost` 직접 상속 금지:** 인프라 표준 기능이 누락됩니다.
- **`job.data` 용량 주의:** 수 MB 단위의 데이터를 Job에 넣지 마십시오. 필요한 경우 DB 키(ID)만 전달하고 워커 내부에서 조회하십시오.
- **타입 import:** DTO나 Interface를 import 할 때는 `import type { ... }` 문법을 사용하십시오.
