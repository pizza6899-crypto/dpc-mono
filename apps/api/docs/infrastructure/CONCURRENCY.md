---
module: concurrency
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: infrastructure-module
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - concurrency
  - advisory-lock
  - distributed-lock
  - postgres
  - lock-strategy
tasks:
  - choose-lock-strategy
  - debug-lock-contention
  - inspect-global-lock
relatedDocs:
  - README.md
  - PRISMA.md
  - CLS.md
trustLevel: medium
owner: infrastructure-concurrency
reviewResponsibility:
  - review when advisory/global lock strategy, namespaces, or timeout defaults change
  - review when `global_locks` schema or lock ownership semantics change
  - review when lock timeout or failure-handling contracts change
sourceRoots:
  - ../../src/infrastructure/concurrency
---

# Concurrency 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/concurrency`

간단 요약
- 목적: 동시 요청, 다중 인스턴스, 스케줄러 중복 실행 같은 경쟁 상태를 제어하는 공통 인프라입니다.
- 핵심 책임: 같은 비즈니스 대상을 동시에 수정하지 못하게 막는 트랜잭션 범위 락, 그리고 여러 서버 중 한 대만 특정 작업을 수행하게 만드는 전역 락을 제공합니다.
- 이 모듈은 사실상 두 가지 락 시스템을 함께 제공합니다.
  - `AdvisoryLockService`: PostgreSQL 트랜잭션 범위 advisory lock
  - `ConcurrencyService`: `global_locks` 테이블 기반 전역 분산 락

이 문서를 먼저 읽어야 하는 질문
- Advisory lock과 global lock 중 어떤 방식을 선택해야 하는가?
- 트랜잭션 안에서 같은 엔티티의 동시 수정은 어떻게 막는가?
- 배치나 스케줄러의 중복 실행을 여러 인스턴스 환경에서 어떻게 방지하는가?

관련 sibling 문서
- [PRISMA.md](PRISMA.md) — advisory lock이 실제로 어떤 트랜잭션 경로 위에서 동작하는지 함께 봐야 합니다.
- [BULLMQ.md](BULLMQ.md) — global lock의 대표 사용처인 스케줄러 초기화 흐름을 바로 이어서 확인할 수 있습니다.
- [CLS.md](CLS.md) — 트랜잭션 경계가 CLS 컨텍스트와 어떻게 결합되는지 같이 볼 때 이해가 쉬워집니다.

소스 구성
- [../../src/infrastructure/concurrency/advisory-lock.service.ts](../../src/infrastructure/concurrency/advisory-lock.service.ts) — 트랜잭션 범위 advisory lock
- [../../src/infrastructure/concurrency/concurrency.service.ts](../../src/infrastructure/concurrency/concurrency.service.ts) — 전역 table lock
- [../../src/infrastructure/concurrency/concurrency.constants.ts](../../src/infrastructure/concurrency/concurrency.constants.ts) — 락 네임스페이스/글로벌 락 키/기본 타임아웃
- [../../src/infrastructure/concurrency/concurrency.module.ts](../../src/infrastructure/concurrency/concurrency.module.ts) — 모듈 등록
- [../../src/infrastructure/concurrency/index.ts](../../src/infrastructure/concurrency/index.ts) — re-export 진입점

관련 의존성
- [../../src/infrastructure/prisma/prisma.module.ts](../../src/infrastructure/prisma/prisma.module.ts) — `AdvisoryLockService` 트랜잭션 컨텍스트 기반
- [../../src/infrastructure/node-identity/node-identity.service.ts](../../src/infrastructure/node-identity/node-identity.service.ts) — `ConcurrencyService`의 락 소유자 식별자 생성
- [../../prisma/schema/infra.prisma](../../prisma/schema/infra.prisma) — `GlobalLock` 모델 정의

한눈에 보는 구조
1. 짧은 트랜잭션 안에서 같은 엔티티를 동시에 수정하면 안 되는 경우 `AdvisoryLockService`를 사용합니다.
2. 긴 작업이나 스케줄러처럼 트랜잭션 밖에서도 한 인스턴스만 실행되어야 하면 `ConcurrencyService`를 사용합니다.
3. Advisory lock은 트랜잭션 종료 시 자동 해제됩니다.
4. Global lock은 DB 테이블 row 상태로 관리되며 timeout 기반 자동 회수 기능이 있습니다.

두 락 모델의 차이

## 1. Advisory Lock
- 범위: 현재 DB 트랜잭션
- 저장 위치: PostgreSQL advisory lock 시스템
- 해제 시점: 트랜잭션 종료 시 자동 해제
- 적합한 경우:
  - 같은 유저 지갑 갱신 중복 방지
  - 같은 입금/출금 건 상태 전이 보호
  - 같은 게임 라운드 처리 중복 방지
  - 같은 유저의 중복 비즈니스 명령 방지

## 2. Global Lock
- 범위: 애플리케이션 인스턴스 간 분산 작업
- 저장 위치: `global_locks` 테이블
- 해제 시점: 명시적 `release()` 또는 timeout 만료 후 회수
- 적합한 경우:
  - 다중 인스턴스에서 스케줄러 한 대만 실행
  - 장시간 배치/동기화 작업 단일 실행
  - 긴 작업이라 트랜잭션을 계속 열어둘 수 없는 경우

파일별 상세 분석

## 1. `concurrency.constants.ts`

역할
- 락 분류 체계와 공통 상수를 정의합니다.

핵심 요소
- `LockNamespace`
  - advisory lock 대상의 논리적 종류를 표현하는 enum입니다.
  - 예: `USER_WALLET`, `DEPOSIT`, `WITHDRAWAL`, `GAME_ROUND`, `ARTIFACT_MASTER`
- `CONCURRENCY_CONSTANTS.DB_LOCK_TIMEOUT = '3s'`
  - advisory lock 대기 시간 기본값입니다.
- `GlobalLockKey`
  - 전역 락 키 문자열 모음입니다.
  - 예: `BULLMQ_SCHEDULER_INIT`, `EXCHANGE_RATE_UPDATE`, `AUTH_EXPIRE_SESSIONS`

중요한 설계 포인트
- `LockNamespace` 값은 PostgreSQL 락 키로 직접 사용되지 않습니다.
- 실제로는 `namespace:id` 문자열을 만들고, 그 문자열을 해시해서 64비트 정수 키를 생성합니다.
- 따라서 enum 숫자는 “락 공간을 구분하는 시드” 역할입니다.

실무 의미
- 새 도메인 락을 추가할 때는 문자열 키를 제각각 만들지 말고 `LockNamespace`나 `GlobalLockKey`에 먼저 등록하는 것이 표준입니다.

## 2. `advisory-lock.service.ts`

역할
- PostgreSQL transaction-level advisory lock을 다룹니다.

의존성
- `@InjectTransaction()`으로 주입받은 `PrismaTransaction`

이 점이 의미하는 것
- 이 서비스는 설계상 활성 트랜잭션 내부에서 사용되는 것을 전제로 합니다.
- 실제 사용 패턴을 검색해 보면 대표 호출부들은 대부분 `@Transactional()` 메서드 안에 있습니다.

### `acquireLock(namespace, id, options?)`

동작 순서
1. `generateKey(namespace, id)`로 64비트 signed 정수 키 생성
2. 현재 트랜잭션에 `SET LOCAL lock_timeout = '3s'` 적용
3. `SELECT pg_advisory_xact_lock(key)` 실행
4. 락 획득 성공 시 반환
5. 타임아웃이면 필요 시 `CONCURRENCY_LOCK_TIMEOUT` 에러로 변환

중요 구현 포인트
- `SET LOCAL`을 쓰므로 현재 트랜잭션 범위에만 lock timeout이 적용됩니다.
- `pg_advisory_xact_lock`은 blocking lock입니다. 상대 트랜잭션이 먼저 잡고 있으면 기다립니다.
- 기다리는 최대 시간은 `DB_LOCK_TIMEOUT`에 의해 제한됩니다.

왜 `SET LOCAL`을 raw string으로 실행하나
- 코드 주석상 Kysely/Prisma adapter 환경에서 `SET` 구문 파라미터 바인딩 시 문법 문제가 있어 raw string을 사용합니다.

### 에러 처리
- `isLockTimeoutError()`는 다음을 락 타임아웃으로 간주합니다.
  - PostgreSQL 코드 `55P03`
  - `error.meta?.code === '55P03'`
  - 메시지에 `55P03` 포함
  - 메시지에 `lock timeout` 포함
- `options.throwThrottleError === true`면 일반 `Error('CONCURRENCY_LOCK_TIMEOUT')`를 던집니다.

[주의]
- 현재 검색 범위 기준으로 `CONCURRENCY_LOCK_TIMEOUT` 문자열을 별도 예외 클래스로 변환하는 코드는 이 모듈 내부에서 보이지 않습니다.
- 즉, 이 값은 상위 계층이나 글로벌 예외 처리에서 해석해야 하는 sentinel 계약에 가깝습니다.

### `tryAcquireLock(namespace, id)`

동작 순서
1. 같은 방식으로 64비트 키 생성
2. `SELECT pg_try_advisory_xact_lock(key)` 실행
3. 즉시 `true`/`false` 반환

특징
- non-blocking입니다.
- 이미 다른 트랜잭션이 잡고 있으면 기다리지 않고 바로 `false`를 반환합니다.

관찰
- 현재 검색 기준으로 이 메서드의 실제 호출부는 보이지 않았습니다.
- 즉, 구현은 존재하지만 현재 주 사용 패턴은 `acquireLock()`입니다.

### `generateKey(namespace, id)`

동작 방식
1. `${namespace}:${id}` 문자열 생성
2. MD5 해시 계산
3. 해시 앞 16자리만 사용해 64비트 정수 생성
4. `BigInt.asIntN(64, ...)`로 PostgreSQL `bigint` 호환 signed 값으로 변환

왜 이렇게 하나
- PostgreSQL advisory lock은 정수 키를 받습니다.
- 문자열 기반 대상(`aggregator:roundId`, `userId`, `code`)을 일관된 64비트 정수로 바꾸기 위한 어댑터입니다.

실무 의미
- 동일한 `namespace + id` 조합은 항상 동일한 락 키를 만듭니다.
- 다른 namespace를 쓰면 같은 id여도 서로 다른 락 공간을 사용합니다.

## 3. `concurrency.service.ts`

역할
- 테이블 기반 전역 락을 제공합니다.

의존성
- `PrismaService`
- `NodeIdentityService`

핵심 아이디어
- 락의 생명주기를 PostgreSQL row 상태로 명시적으로 관리합니다.
- 세션 락처럼 DB connection 상태에 의존하지 않고, timeout 기반 회수가 가능합니다.

### `instanceId`
- `NodeIdentityService.getDisplayId()`를 사용합니다.
- 형식은 `node-{id}-{hostname}-{shortUuid}`입니다.
- 이 값은 현재 락을 어떤 인스턴스가 잡았는지 식별하는 소유권 정보입니다.

### `tryAcquire(key, options?)`

동작 순서
1. timeout을 결정합니다. 기본값은 1800초입니다.
2. `global_locks` 테이블에 row insert 시도
3. 충돌 시 `ON CONFLICT`로 기존 row 업데이트 시도
4. 단, 다음 조건일 때만 갱신됩니다.
   - 현재 `is_acquired = false`
   - 또는 기존 락이 timeout으로 만료됨
5. `RETURNING key`가 있으면 획득 성공, 없으면 실패

핵심 SQL 설계 포인트
- `clock_timestamp()`를 사용합니다.
- 이유: 트랜잭션 시작 시각이 아닌 실제 쿼리 실행 시각을 기준으로 timeout 판정을 하기 위해서입니다.
- 코드 주석상 Prisma transaction proxy를 우회하고 직접 Kysely 쿼리를 사용해 트랜잭션 전파 영향을 차단합니다.

중요한 성질
- 락 획득 실패와 DB 에러를 모두 `false`로 다룹니다. 에러는 logger에 남기고 호출자는 락 실패처럼 취급합니다.
- 따라서 `runExclusive()` 호출부는 “이미 누가 잡고 있음”과 “획득 과정 에러”를 구분하지 않습니다.

### `release(key, success, errorMessage?)`

동작 순서
1. `global_locks`에서 `key + instanceId + isAcquired = true` 조건으로 업데이트
2. `isAcquired = false`로 해제
3. `lastResult`, `errorMessage`, `lastFinishedAt` 기록

소유권 보호
- 현재 인스턴스가 잡은 락만 해제할 수 있도록 `instanceId` 조건을 둡니다.
- 다른 인스턴스가 락을 훔쳐 가거나 timeout 회수 후 재획득한 경우 잘못 해제하지 않도록 방어합니다.

### `runExclusive(key, task, options?)`

동작 순서
1. `tryAcquire()` 시도
2. 실패하면 아무것도 하지 않고 그냥 반환
3. 성공하면 task 실행
4. 성공 시 `release(key, true)`
5. 실패 시 로그 남기고 `release(key, false, errorMessage)` 후 에러 재던짐

실무 의미
- 호출부는 락 획득, 실행, 성공/실패 결과 기록, 해제까지 한 번에 처리할 수 있습니다.
- 현재 코드 기준 실제 사용처는 [../../src/infrastructure/bullmq/bullmq.scheduler.service.ts](../../src/infrastructure/bullmq/bullmq.scheduler.service.ts)입니다.

## 4. `concurrency.module.ts`

역할
- `ConcurrencyService`, `AdvisoryLockService`를 제공하는 일반 Nest 모듈입니다.

중요한 관찰
- `@Global()`이 아닙니다.
- 따라서 사용하는 기능 모듈에서 명시적으로 import 해야 합니다.

실제 사용 패턴
- 검색 결과 기준으로 `DepositModule`, `WithdrawalModule`, `CasinoModule`, `CompModule`, `ChatSupportModule`, `TierEvaluatorModule` 등 많은 모듈이 직접 import합니다.
- 반면 `PrismaModule`, `NodeIdentityModule`은 전역 모듈이어서 이 서비스들의 의존성은 별도 import 없이 해결됩니다.

## 5. `index.ts`

역할
- 모듈/서비스/상수 re-export 진입점입니다.

실무 의미
- 호출부는 `src/infrastructure/concurrency`만 import해도 대부분의 public API를 사용할 수 있습니다.

스키마 분석: `GlobalLock`

위치
- [../../prisma/schema/infra.prisma](../../prisma/schema/infra.prisma)

핵심 필드
- `key`: 락 식별자, PK
- `instanceId`: 현재 점유 인스턴스 식별자
- `isAcquired`: 점유 여부
- `lockedAt`: 락 획득 시점
- `timeoutSeconds`: 좀비 락 회수 기준
- `lastResult`: 마지막 실행 결과
- `errorMessage`: 마지막 실패 메시지 요약
- `lastFinishedAt`: 마지막 종료 시각

설계 의도
- 단순 락 상태뿐 아니라 운영 가시성까지 확보하려는 모델입니다.
- 현재 어떤 작업이 어디서 잡혀 있는지, 마지막 실행이 성공했는지 실패했는지 DB에서 확인할 수 있습니다.

실제 사용 패턴 분석

## 1. 트랜잭션 비즈니스 보호: Advisory Lock

대표 예시
- [../../src/modules/deposit/application/process-deposit.service.ts](../../src/modules/deposit/application/process-deposit.service.ts)
- [../../src/modules/casino/application/process-casino-bet.service.ts](../../src/modules/casino/application/process-casino-bet.service.ts)
- [../../src/modules/affiliate/code/application/create-code.service.ts](../../src/modules/affiliate/code/application/create-code.service.ts)
- [../../src/modules/wallet/application/update-user-balance.service.ts](../../src/modules/wallet/application/update-user-balance.service.ts)

공통 패턴
1. 서비스 메서드에 `@Transactional()` 부여
2. 메서드 초반에 `advisoryLockService.acquireLock(...)` 호출
3. 같은 트랜잭션 안에서 엔티티 조회/검증/상태 변경/저장 수행

왜 초반에 락을 잡는가
- 상태 조회 후 락을 잡으면, 조회와 변경 사이에 경쟁 상태가 생길 수 있습니다.
- 그래서 보통 조회 전 또는 아주 초기에 락을 획득합니다.

키 설계 예시
- 단일 엔티티 ID: `LockNamespace.DEPOSIT + depositId`
- 유저 단위: `LockNamespace.USER_WALLET + userId`
- 복합 비즈니스 키: `LockNamespace.GAME_ROUND + ${aggregatorType}:${roundId}`

## 2. 중복 요청을 429 스타일로 취급하려는 패턴
- 많은 호출부가 `throwThrottleError: true` 옵션을 전달합니다.
- 예시:
  - 입금/출금 처리
  - 지갑 잔액 업데이트
  - 카지노 베팅/정산
  - 프로모션 지급
  - 제휴 코드 생성

의미
- 설계 의도상 락 경합은 단순 DB 오류가 아니라 “잠시 후 재시도해야 하는 중복 실행 시도”로 다루려는 패턴입니다.

## 3. 분산 단일 실행: Global Lock

대표 예시
- [../../src/infrastructure/bullmq/bullmq.scheduler.service.ts](../../src/infrastructure/bullmq/bullmq.scheduler.service.ts)

패턴
1. 부팅 시 `runExclusive(GlobalLockKey.BULLMQ_SCHEDULER_INIT, task, { timeoutSeconds: 300 })`
2. 여러 인스턴스가 동시에 시작되어도 한 대만 scheduler sync 수행
3. 나머지는 조용히 건너뜀

실무 의미
- 전역 락은 현재 코드 기준으로 스케줄러 초기화 보호에 실제 사용되고 있습니다.
- `GlobalLockKey`에 다른 키들이 정의되어 있지만, 검색 결과 기준 `runExclusive()` 실제 호출부는 현재 이 한 곳만 확인되었습니다.

테스트 현황
- `apps/api/src/infrastructure/concurrency` 아래 전용 spec 파일은 보이지 않았습니다.
- 간접적으로는 [../../src/modules/affiliate/commission/schedulers/settle-daily-commissions.scheduler.spec.ts](../../src/modules/affiliate/commission/schedulers/settle-daily-commissions.scheduler.spec.ts)에서 `ConcurrencyService.runExclusive()`를 mock하여 스케줄러 동작을 검증합니다.

운영상 중요한 포인트

## 1. Advisory lock은 반드시 짧은 트랜잭션에 적합
- 트랜잭션이 오래 열려 있으면 다른 요청이 계속 대기하게 됩니다.
- 기본 대기 시간도 3초로 짧게 잡혀 있으므로, 긴 작업에는 부적합합니다.

## 2. Global lock은 스케줄러/배치용
- 장시간 실행되는 작업을 트랜잭션 advisory lock으로 보호하려 하지 말고 table lock을 써야 합니다.
- 현재 설계도 바로 그 용도로 둘을 분리합니다.

## 3. 락 소유권은 인스턴스 식별자에 귀속
- Global lock 해제는 같은 `instanceId`만 가능합니다.
- 이 인스턴스 ID는 `NodeIdentityService`가 Redis 기반으로 관리하는 node ID를 포함합니다.

## 4. 에러를 조용히 실패처럼 처리하는 부분이 있음
- `ConcurrencyService.tryAcquire()`는 DB 오류가 나도 `false`를 반환합니다.
- 운영 시 락이 단순히 “누가 잡고 있음”인지, 실제 DB 오류인지 logger를 같이 봐야 합니다.

## 5. `tryAcquireLock()`는 현재 실사용 흔적이 없음
- 향후 non-blocking 시나리오용 확장 포인트이지만, 현재 주력 경로는 아닙니다.

설계상 주의사항

## 1. `AdvisoryLockService`는 트랜잭션 컨텍스트 의존
- `@InjectTransaction()` 기반이라 트랜잭션 없는 환경에서 사용하는 것은 이 모듈의 의도와 맞지 않습니다.
- 실사용 코드도 대부분 `@Transactional()` 안에서 호출합니다.

## 2. `CONCURRENCY_LOCK_TIMEOUT`은 일반 문자열 에러
- 전용 domain exception이 아닙니다.
- 상위 계층에서 이 에러를 어떻게 사용자 응답으로 매핑할지 명확히 관리해야 합니다.

## 3. 네임스페이스 선택이 중요
- 잘못된 namespace를 재사용하면 서로 다른 도메인 작업이 불필요하게 직렬화될 수 있습니다.
- 반대로 너무 세밀한 키를 쓰면 실제로 막고 싶은 경쟁 상태를 놓칠 수 있습니다.

## 4. Global lock timeout 설계가 중요
- 너무 짧으면 작업 중간에 락이 만료되어 다른 인스턴스가 다시 진입할 수 있습니다.
- 너무 길면 장애 후 회복이 늦어집니다.

새 작업 시 체크리스트
1. 보호하려는 대상이 “짧은 트랜잭션 안의 단일 엔티티/유저/라운드”인지, “긴 분산 작업”인지 먼저 구분
2. 전자면 `AdvisoryLockService`, 후자면 `ConcurrencyService` 선택
3. advisory lock이면 `@Transactional()` 경계 안에서 가장 먼저 락 획득
4. 락 키는 충돌 가능성과 보호 범위를 고려해 설계
5. 중복 요청을 사용자에게 재시도 가능 오류로 보낼지 결정하고 `throwThrottleError` 사용 여부 판단
6. global lock이면 timeout을 작업 예상 시간에 맞춰 조정
7. 실제 운영에서 락 상태를 추적해야 하면 `global_locks` 테이블 조회 전략까지 고려

변경 시 특히 조심할 점
- `generateKey()` 변경: 기존 락 키 체계 전체에 영향
- `DB_LOCK_TIMEOUT` 변경: 대기 정책과 사용자 체감 오류 빈도에 영향
- `tryAcquire()` SQL 조건 변경: 중복 실행 방지와 좀비 락 회수 정책 전체에 영향
- `release()`의 instanceId 조건 제거/변경: 락 소유권 보장이 깨질 수 있음
- `GlobalLockKey` 문자열 변경: 기존 운영 row와 모니터링 기준이 바뀜

요약 결론
- 이 모듈의 핵심은 “동시성 문제를 하나의 방식으로 퉁치지 않고, 트랜잭션 락과 분산 작업 락을 분리해 설계했다”는 점입니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - 짧고 강한 보호는 `AdvisoryLockService`, 길고 분산된 보호는 `ConcurrencyService`
  - advisory lock은 `@Transactional()`과 함께 써야 의미가 완성됨
  - global lock은 `global_locks` row와 timeout, instance ownership으로 운영 가시성과 회복성을 함께 확보한다는 점