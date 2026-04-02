# BullMQ 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/bullmq`

간단 요약
- 목적: 프로젝트 전반의 큐 처리 인프라를 표준화하는 공통 모듈입니다.
- 핵심 책임: Redis 연결 구성, 큐 레지스트리 통합, 반복 작업 스케줄 동기화, 프로세서 공통 래핑, 장애 시 감사 로그 연동.
- 이 모듈은 직접 비즈니스 로직을 수행하지 않고, 각 도메인이 정의한 `*.bullmq.ts`, 프로세서, 프로듀서를 연결해 주는 기반 계층입니다.

소스 구성
- [../../src/infrastructure/bullmq/base.processor.ts](../../src/infrastructure/bullmq/base.processor.ts) — 모든 프로세서의 공통 부모 클래스
- [../../src/infrastructure/bullmq/bullmq.types.ts](../../src/infrastructure/bullmq/bullmq.types.ts) — 상수 및 `QueueConfig` 타입 정의
- [../../src/infrastructure/bullmq/bullmq.registry.ts](../../src/infrastructure/bullmq/bullmq.registry.ts) — 도메인별 큐 설정 집계
- [../../src/infrastructure/bullmq/bullmq.constants.ts](../../src/infrastructure/bullmq/bullmq.constants.ts) — 레지스트리 브리지 및 `getQueueConfig()`
- [../../src/infrastructure/bullmq/bullmq.module.ts](../../src/infrastructure/bullmq/bullmq.module.ts) — BullMQ 루트 모듈
- [../../src/infrastructure/bullmq/bullmq.scheduler.service.ts](../../src/infrastructure/bullmq/bullmq.scheduler.service.ts) — 반복 작업 동기화 및 유령 큐 정리

한눈에 보는 구조
1. 각 도메인은 자신의 `*.bullmq.ts` 파일에서 큐 설정을 정의합니다.
2. `bullmq.registry.ts`가 이 설정들을 한 곳에 모아 전역 레지스트리를 구성합니다.
3. 각 기능 모듈은 `BullModule.registerQueue(...)`로 필요한 큐를 등록합니다.
4. 프로듀서는 `@InjectQueue(queueName)`로 큐를 주입받아 잡을 추가합니다.
5. 프로세서는 `BaseProcessor`를 상속하고 `@Processor(...)`로 워커에 연결됩니다.
6. 애플리케이션 부팅 시 `BullMqSchedulerService`가 모든 반복 작업 정의를 Redis와 동기화합니다.

아키텍처 핵심 포인트

1) 연결 분리: Default / WORKER
- [../../src/infrastructure/bullmq/bullmq.module.ts](../../src/infrastructure/bullmq/bullmq.module.ts)는 Bull 연결을 두 개 만듭니다.
- 기본 연결은 주로 큐 등록과 잡 enqueue에 사용됩니다.
- `WORKER` 연결은 프로세서 실행용입니다.
- `getQueueConfig()`가 모든 프로세서에 `configKey: 'WORKER'`를 기본 주입하므로, 프로세서는 별도 지정 없이 워커 전용 연결을 사용하게 됩니다.
- 두 연결 모두 동일한 Redis(`host`, `port`, `password`)와 동일한 prefix를 사용합니다.

2) 전역 설정 상수
- [../../src/infrastructure/bullmq/bullmq.types.ts](../../src/infrastructure/bullmq/bullmq.types.ts)에 인프라 기본값이 모여 있습니다.
- `BULLMQ_DEFAULT_TIMEZONE = 'Asia/Tokyo'`
- `BULLMQ_PREFIX = 'bull'`
- `BULLMQ_RETENTION`
  - `DEFAULT_COMPLETED = 100`
  - `DEFAULT_FAILED = 1000`
  - `LONG_TERM_FAILED = 5000`
- 이 값들은 각 도메인의 큐 정의 파일에서 반복적으로 참조됩니다.

3) 도메인 큐 정의는 인프라 외부에 있음
- 실제 큐 이름, 재시도 횟수, backoff, 보관 정책, concurrency, 반복 작업은 각 도메인 `*.bullmq.ts` 파일에 있습니다.
- 예시:
  - [../../src/modules/audit-log/infrastructure/audit-log.bullmq.ts](../../src/modules/audit-log/infrastructure/audit-log.bullmq.ts)
  - [../../src/modules/auth/session/infrastructure/session.bullmq.ts](../../src/modules/auth/session/infrastructure/session.bullmq.ts)
  - [../../src/modules/exchange/infrastructure/exchange.bullmq.ts](../../src/modules/exchange/infrastructure/exchange.bullmq.ts)

파일별 상세 분석

## 1. `bullmq.types.ts`

역할
- BullMQ 인프라의 공통 타입 계약과 기본 상수를 정의합니다.

핵심 요소
- `ProcessorOptions`
  - NestJS `@Processor()` 데코레이터에 넘길 옵션입니다.
  - `name`, `scope`, `configKey`를 가질 수 있습니다.
- `QueueConfig`
  - `RegisterQueueOptions`를 확장한 프로젝트 표준 큐 설정 타입입니다.
  - 추가 필드:
    - `processorOptions?`
    - `workerOptions?`
    - `repeatableJobs?`
- `repeatableJobs`
  - 부팅 시 자동 등록할 cron 작업 목록입니다.
  - 각 항목은 `name`, `data`, `repeat.pattern`, `repeat.tz?`를 가집니다.

실무 의미
- 큐 정의 파일이 이 타입을 만족하면, 등록/프로세서/스케줄러가 같은 계약으로 움직입니다.
- `repeatableJobs`는 단순 타입 선언이 아니라, 실제로 스케줄러 서비스에서 읽어 동기화에 사용됩니다.

## 2. `bullmq.registry.ts`

역할
- 여러 도메인의 큐 정의를 전역 레지스트리 하나로 합칩니다.

핵심 로직
- `BULLMQ_REGISTRY`
  - `AUDIT`, `CASINO`, `NOTIFICATION`, `TIER` 등 도메인별 큐 설정 객체를 모읍니다.
- `ALL_BULLMQ_QUEUES`
  - 레지스트리를 평탄화한 배열입니다.
  - `processorOptions`, `workerOptions`는 제거하고, 나머지 등록 정보만 남깁니다.
  - `repeatableJobs`는 제거하지 않으므로 스케줄러에서 계속 사용할 수 있습니다.

실무 의미
- 새 큐를 추가할 때 도메인 `*.bullmq.ts`만 만드는 것으로 끝나지 않습니다.
- 반드시 이 레지스트리에 포함되어야 스케줄러가 해당 큐를 인지하고 운영 대상에 넣습니다.

## 3. `bullmq.constants.ts`

역할
- 기존 코드가 안정적으로 참조할 수 있는 공개 진입점 역할을 합니다.

핵심 로직
- `BULLMQ_QUEUES = BULLMQ_REGISTRY`
  - 하위 호환성을 위한 브리지입니다.
- `ALL_BULLMQ_QUEUES`
  - registry에서 만든 평탄화 배열을 재노출합니다.
- `getQueueConfig(config)`
  - 프로세서 데코레이터에 필요한 값을 보강합니다.
  - `processorOptions.name = config.name`
  - `processorOptions.configKey = 'WORKER'`
  - `workerOptions`가 없으면 빈 객체를 기본값으로 줍니다.

왜 중요한가
- 프로세서를 작성할 때 `getQueueConfig()`를 거치지 않으면 `WORKER` 연결을 타지 않거나, `processorOptions.name`이 누락될 수 있습니다.
- 이 함수는 단순 편의 함수가 아니라, 현재 설계에서 프로세서 표준 진입점입니다.

## 4. `bullmq.module.ts`

역할
- BullMQ 루트 인프라 모듈입니다.

구성
- `EnvModule`을 통해 Redis 연결 정보를 주입받습니다.
- `ConcurrencyModule`을 통해 분산 락 서비스를 사용합니다.
- `BullModule.forRootAsync(...)` 2개를 등록합니다.
  - 기본 연결
  - `WORKER` 연결
- `BullMqSchedulerService`를 provider로 등록합니다.

중요한 설계 포인트
- 각 도메인 큐는 여기서 직접 `registerQueue()` 하지 않습니다.
- 실제 큐 등록은 각 기능 모듈에서 담당합니다.
- 즉, 이 모듈은 “인프라 기반”을 제공하고, “어떤 큐를 쓸지”는 도메인 모듈이 결정합니다.

예시
- [../../src/modules/audit-log/audit-log.module.ts](../../src/modules/audit-log/audit-log.module.ts)
- [../../src/modules/auth/session/session.module.ts](../../src/modules/auth/session/session.module.ts)
- [../../src/modules/notification/common/notification-queue.module.ts](../../src/modules/notification/common/notification-queue.module.ts)

## 5. `bullmq.scheduler.service.ts`

역할
- 애플리케이션 부팅 시 Redis에 저장된 반복 작업 상태와 코드에 정의된 반복 작업 상태를 맞춥니다.
- 더 이상 코드에 없는 큐를 정리하는 운영 정합성 작업도 수행합니다.

부팅 시 흐름
1. `onModuleInit()` 호출
2. `ConcurrencyService.runExclusive()`로 전역 락 획득
3. `syncSchedulers()` 실행
4. 유령 큐 정리
5. 각 큐의 repeatable job 동기화

전역 락을 거는 이유
- 여러 서버가 동시에 떠 있는 환경에서, 모든 인스턴스가 스케줄 동기화를 동시에 수행하면 중복 등록/경합이 생길 수 있습니다.
- 이를 막기 위해 `GlobalLockKey.BULLMQ_SCHEDULER_INIT` 키로 단일 실행을 보장합니다.

`syncSchedulers()` 상세 로직
- `ALL_BULLMQ_QUEUES`에서 코드상 정의된 큐 이름 목록을 수집합니다.
- 먼저 `purgeObsoleteQueues()`를 호출해 Redis에만 남아 있는 큐를 정리합니다.
- 이후 각 큐마다 `Queue` 인스턴스를 직접 만들고 다음을 수행합니다.

세부 단계
1. `queue.getJobSchedulers()`로 현재 Redis의 반복 작업 조회
2. 기존 작업을 순회하며 다음 케이스를 정리
   - 코드에 없는 잡 이름: 삭제
   - 같은 이름이지만 cron 패턴이 달라짐: 삭제
   - timezone이 달라짐: 삭제
   - 레거시 ID(`repeat-${name}`)를 쓰는 작업: 삭제
3. 현재 코드 기준의 `repeatableJobs`를 다시 `queue.add(...)`로 등록
4. queue는 `finally`에서 항상 `close()`

파괴적 로직 주의
- `purgeObsoleteQueues()`는 Redis를 직접 스캔해 코드에 없는 큐를 찾아 `queue.obliterate({ force: true })`를 수행합니다.
- 이는 의도적으로 강한 정리 로직입니다.
- 단, 정의된 큐가 하나도 없으면 전체 삭제 사고를 막기 위해 purge를 건너뜁니다.

Redis 스캔 방식
- 스캔 패턴: `${BULLMQ_PREFIX}:*:meta`
- 여기서 발견된 키를 기반으로 큐 이름을 추출합니다.
- prefix에 `:`가 포함될 수 있다는 점을 고려해, 마지막에서 두 번째 segment를 큐 이름으로 사용합니다.

timezone 처리
- 개별 repeat job이 `tz`를 명시하지 않으면 `Asia/Tokyo`가 기본 적용됩니다.
- 이 기본값은 [../../src/infrastructure/bullmq/bullmq.types.ts](../../src/infrastructure/bullmq/bullmq.types.ts)에서 관리됩니다.

## 6. `base.processor.ts`

역할
- 모든 프로세서의 공통 실행 래퍼입니다.

제공 기능
1. CLS 컨텍스트 생성
2. 작업 시작/완료/실패 로그 기록
3. 처리 시간 측정
4. 오류 발생 시 Audit Log 연동
5. 애플리케이션 종료 시 워커 graceful shutdown

`process(job)` 상세 흐름
1. 시작 시각 기록
2. `this.cls.run(...)`으로 CLS 컨텍스트 시작
3. CLS에 다음 값 주입
   - `jobId`
   - `queueName`
   - `attempt`
4. 디버그 로그 출력
5. 실제 비즈니스 로직 `processJob(job)` 호출
6. 성공 시 duration 계산 후 완료 로그 출력
7. 실패 시 `reportToAuditSystem()` 호출 후 에러 재던짐

왜 에러를 다시 던지는가
- BullMQ의 재시도 메커니즘을 동작시키기 위해서입니다.
- 여기서 에러를 삼켜 버리면 `attempts`, `backoff` 정책이 무력화됩니다.

`reportToAuditSystem()` 상세 로직
- 감사 로그 큐 자체는 예외입니다.
  - `audit-log-critical`
  - `audit-log-heavy`
- 이유: 감사 로그 실패를 다시 감사 로그 큐에 적재하면 무한 루프가 생길 수 있기 때문입니다.
- `job.data`는 안전하게 직렬화하려고 시도합니다.
  - 5000자를 넘으면 preview만 남깁니다.
  - 직렬화 실패 시 `_error` 객체로 대체합니다.
- `DispatchLogService`가 주입되어 있으면 `LogType.ERROR`로 전송합니다.
- 감사 로그 보고가 다시 실패하더라도 표준 logger에만 남기고 본래 에러 흐름은 유지합니다.

`onApplicationShutdown()` 상세 로직
- `WorkerHost`의 `worker` 인스턴스를 가져와 종료 절차를 수행합니다.
- 가능하면 `pause()` 후 `close()` 합니다.
- 이미 닫힘/미초기화 상태에서 나는 일반적인 오류는 무시하고, 그 외 오류만 logger에 남깁니다.

실제 사용 패턴

## 1. 큐 정의
도메인별 `*.bullmq.ts`에서 큐 설정을 선언합니다.

예시
- [../../src/modules/auth/session/infrastructure/session.bullmq.ts](../../src/modules/auth/session/infrastructure/session.bullmq.ts)
- [../../src/modules/audit-log/infrastructure/audit-log.bullmq.ts](../../src/modules/audit-log/infrastructure/audit-log.bullmq.ts)

일반적으로 포함하는 값
- `name`
- `defaultJobOptions.attempts`
- `defaultJobOptions.backoff`
- `removeOnComplete`, `removeOnFail`
- `workerOptions.concurrency`
- 필요 시 `repeatableJobs`

## 2. 기능 모듈에서 큐 등록
기능 모듈은 `BullMqModule`을 import하고, 필요한 큐를 `BullModule.registerQueue(...)`로 등록합니다.

예시
- [../../src/modules/auth/session/session.module.ts](../../src/modules/auth/session/session.module.ts)
- [../../src/modules/audit-log/audit-log.module.ts](../../src/modules/audit-log/audit-log.module.ts)
- [../../src/modules/notification/common/notification-queue.module.ts](../../src/modules/notification/common/notification-queue.module.ts)

## 3. 프로듀서에서 잡 enqueue
프로듀서는 `@InjectQueue(queueName)`로 큐를 주입받습니다.

대표 예시
- [../../src/modules/audit-log/application/dispatch-log.service.ts](../../src/modules/audit-log/application/dispatch-log.service.ts)

이 서비스가 하는 일
- 로그 타입에 따라 큐 선택
- 잡 payload 정제
- Snowflake 기반 `jobId` 생성
- `queue.add(jobName, jobData, options)` 호출

## 4. 프로세서에서 잡 consume
프로세서는 `BaseProcessor`를 상속하고 `@Processor(getQueueConfig(...))` 패턴을 사용합니다.

대표 예시
- [../../src/modules/audit-log/infrastructure/processors/critical-log.processor.ts](../../src/modules/audit-log/infrastructure/processors/critical-log.processor.ts)
- [../../src/modules/auth/infrastructure/processors/expire-sessions.processor.ts](../../src/modules/auth/infrastructure/processors/expire-sessions.processor.ts)

패턴 요약
- `const queueConfig = getQueueConfig(MY_QUEUE)`
- `@Processor(queueConfig.processorOptions, queueConfig.workerOptions)`
- `class XxxProcessor extends BaseProcessor<JobData, Result>`
- `protected async processJob(job: Job<JobData>) { ... }`

## 5. 반복 작업 작성 패턴
반복 작업은 큐 정의 파일의 `repeatableJobs`에 선언하고, 프로세서 내부에서 `job.name`으로 분기합니다.

예시
- [../../src/modules/auth/session/infrastructure/session.bullmq.ts](../../src/modules/auth/session/infrastructure/session.bullmq.ts)
- [../../src/modules/auth/infrastructure/processors/expire-sessions.processor.ts](../../src/modules/auth/infrastructure/processors/expire-sessions.processor.ts)

주의점
- `repeatableJobs`의 `name`과 프로세서 내부 분기명이 어긋나면 잡이 등록되어도 처리되지 않습니다.
- cron 수정 시 스케줄러가 기존 항목을 삭제 후 재등록합니다.

운영상 중요한 포인트
- 레지스트리에 없는 큐는 스케줄러가 운영 대상으로 보지 않습니다.
- Redis에만 남아 있는 큐는 부팅 시 삭제 대상이 될 수 있습니다.
- Audit 큐 실패는 감사 시스템으로 재기록하지 않도록 명시적으로 차단되어 있습니다.
- `BaseProcessor`를 우회한 프로세서를 만들면 CLS, duration 로깅, 감사 에러 보고, graceful shutdown 표준이 빠집니다.
- 현재 `apps/api/src/infrastructure/bullmq` 아래에는 전용 spec 테스트 파일이 없습니다. 변경 시 회귀 테스트를 별도로 보강하는 편이 안전합니다.

새 큐 추가 체크리스트
1. 도메인 `*.bullmq.ts`에 `QueueConfig` 정의 추가
2. [../../src/infrastructure/bullmq/bullmq.registry.ts](../../src/infrastructure/bullmq/bullmq.registry.ts)에 레지스트리 연결
3. 기능 모듈에서 `BullMqModule` import 및 `BullModule.registerQueue(...)` 추가
4. 프로듀서가 필요하면 `@InjectQueue` 기반 서비스 추가
5. 컨슈머가 필요하면 `BaseProcessor` 상속 프로세서 추가
6. 반복 작업이면 `repeatableJobs`와 `job.name` 분기 로직을 함께 맞춤
7. 재시도 횟수, backoff, concurrency, 보관 정책을 운영 요구사항에 맞게 조정
8. 부팅 시 스케줄 동기화/삭제 영향이 없는지 점검

변경 시 특히 조심할 점
- `BULLMQ_PREFIX` 변경: Redis 키 네임스페이스가 바뀌므로 운영 영향이 큽니다.
- `BULLMQ_DEFAULT_TIMEZONE` 변경: 모든 cron 해석 기준이 달라질 수 있습니다.
- `purgeObsoleteQueues()` 수정: 잘못 건드리면 정상 큐가 obliterate될 수 있습니다.
- `getQueueConfig()` 수정: 모든 프로세서 연결 방식에 영향을 줍니다.
- `BaseProcessor.process()` 수정: 공통 로깅, CLS, 감사 로그 흐름 전체에 영향이 있습니다.

요약 결론
- 이 BullMQ 모듈은 “큐를 직접 많이 다루는 코드”라기보다, 도메인별 큐 정의를 안전하게 실행하고 운영 상태를 자동 정리하는 기반 프레임입니다.
- 실제 작업 시 가장 중요한 포인트는 세 가지입니다.
  - 새 큐를 만들면 레지스트리에 반드시 연결할 것
  - 프로세서는 `getQueueConfig()` + `BaseProcessor` 패턴을 반드시 따를 것
  - 반복 작업 변경은 단순 코드 수정이 아니라 부팅 시 Redis 상태 동기화까지 함께 일어난다는 점을 고려할 것