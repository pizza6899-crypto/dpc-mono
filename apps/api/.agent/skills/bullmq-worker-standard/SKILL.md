# BullMQ Worker Implementation Standard

## Overview
이 스킬은 프로젝트의 비동기 작업 및 예약 작업(Cron) 처리를 담당하는 **BullMQ Worker(프로세서)**를 구현하기 위한 표준 가이드라인을 제공합니다. 
`BaseProcessor` 상속을 통해 안전한 에러 핸들링, 로깅, Graceful Shutdown을 보장하며, `bullmq.constants.ts`를 사용한 중앙 집중식 설정 관리를 원칙으로 합니다.

---

## Instructions

### 1. 설계 원칙: "1 Queue = 1 Job"
프로젝트의 유지보수성과 운영 효율성을 위해 **하나의 큐에는 하나의 작업(Job)만 할당**하는 것을 원칙으로 합니다.
- **장점**: 개별 작업별 독립적 모니터링, 세밀한 스케일링, 장애 격리 및 설정(동시성 등) 최적화가 가능합니다.
- **예외**: 엄격한 순차 처리가 필요한 연관 작업군인 경우에만 하나의 큐에 여러 Job을 담을 수 있습니다.

### 2. 큐 설정 (Queue Configuration)
새로운 큐를 추가할 때는 반드시 `bullmq.constants.ts`에 설정을 정의해야 합니다.
**[규칙]** 명시적인(Descriptive) 이름을 사용하며, "1 Queue = 1 Job" 원칙에 따라 **Repeatable Job의 이름도 큐 이름과 동일하게 설정**합니다.

```typescript
// src/infrastructure/bullmq/bullmq.constants.ts

export const BULLMQ_QUEUES = {
    MY_DOMAIN: {
        MY_JOB: {
            name: 'my-domain-specific-task', // 큐 이름 (Kebab Case, Descriptive)
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
            workerOptions: { concurrency: 5 },
            // [선택] 반복 작업(Cron) 설정
            repeatableJobs: [
                {
                    name: 'my-domain-specific-task', // 큐 이름과 동일하게 설정
                    repeat: { pattern: '0 * * * * *' }, // Cron 패턴
                },
            ],
        },
    },
} as const satisfies Record<string, Record<string, QueueConfig>>;
```

### 3. 표준 프로세서 구현
모든 Worker 클래스는 반드시 **`BaseProcessor`**를 상속받아야 하며, 상수를 통해 설정을 주입받습니다.

```typescript
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { ClsService } from 'nestjs-cls';

// 1. 설정 가져오기 (상수 참조 필수)
const queueConfig = getQueueConfig(BULLMQ_QUEUES.MY_DOMAIN.MY_JOB);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class MyJobProcessor extends BaseProcessor<MyJobData, void> {
    protected readonly logger = new Logger(MyJobProcessor.name);

    constructor(
        private readonly myService: MyService,
        protected readonly cls: ClsService, // BaseProcessor 필수 의존성
    ) {
        super();
    }

    protected async processJob(job: Job<MyJobData>): Promise<void> {
        const { name, data } = job;

        // 2. 작업 이름 체크 (BULLMQ_QUEUES 상수 참조)
        // Repeatable Job의 이름이 큐 이름과 동일하므로 아래와 같이 체크
        if (name === BULLMQ_QUEUES.MY_DOMAIN.MY_JOB.repeatableJobs?.[0].name) {
            await this.handlePeriodicTask();
            return;
        }

        // 일반 비즈니스 로직 처리
        await this.myService.execute(data);
    }
}
```

### 4. 주요 기능 및 규칙

#### 4.1. 에러 핸들링 및 감사(Audit)
- **자동 로깅**: `BaseProcessor`가 작업 시작/완료/실패를 자동으로 로깅하고 소요 시간을 측정합니다.
- **Audit Log 연동**: 실패 시 에러 내용과 스택 트레이스를 감사 로그 시스템에 자동으로 기록합니다. (데이터가 크면 자동 Truncate)
- **Retry 전략**: 일시적 오류는 `Error`를 throw하여 큐의 `backoff` 정책에 따라 재시도되게 합니다.

#### 4.2. Graceful Shutdown
- `BaseProcessor`가 `OnApplicationShutdown`을 구현하고 있으므로, 서버 종료 시 진행 중인 작업을 안전하게 마무리하거나 `pause` 처리합니다.

#### 4.3. 분산 락 및 스케줄러
- **중복 실행 방지**: BullMQ Repeatable Jobs는 분산 환경에서도 지정된 시간에 단 하나의 워커에서만 실행됨을 보장합니다. 별도의 DB Lock 로직이 필요 없습니다.
- **스케줄러 동기화**: `BullMqSchedulerService`가 서버 시작 시 상수의 설정을 Redis와 소스 코드 간에 자동으로 동기화합니다.

### 5. 주의사항 (Critical)
1. **하드코딩 금지**: 큐 이름이나 작업 이름을 문자열로 직접 쓰지 말고 항상 `BULLMQ_QUEUES` 상수를 참조하십시오.
2. **`BaseProcessor` 필수 사용**: 직접 `WorkerHost`를 상속받으면 로깅, 보안, 감사 기능이 누락됩니다.
3. **가벼운 Job Data**: `job.data`에는 최소한의 식별자(ID)만 담고, 상세 데이터는 프로세서 내부에서 DB를 통해 조회하십시오.
4. **타입 안전성**: `ProcessorOptions`, `QueueConfig` 등은 `src/infrastructure/bullmq/bullmq.types.ts`를 참조하십시오.

