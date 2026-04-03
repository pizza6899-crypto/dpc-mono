---
module: cache
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: infrastructure-module
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - cache
  - redis
  - memory-store
  - serialization
  - ttl
tasks:
  - add-cache-entry
  - debug-cache-behavior
  - choose-cache-store
relatedDocs:
  - README.md
  - PERSISTENCE.md
  - ENV.md
  - THROTTLE.md
trustLevel: medium
owner: infrastructure-cache
reviewResponsibility:
  - review when CACHE_CONFIG store selection, TTL strategy, or cache key policy changes
  - review when Redis serialization, `getOrSet()`, or `getAndTouch()` semantics change
  - review when cache service behavior diverges from the access patterns described here
sourceRoots:
  - ../../src/infrastructure/cache
---

# Cache 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/cache`

간단 요약
- 목적: 프로젝트 전반에서 사용할 캐시 접근 방식을 표준화하는 공통 인프라 모듈입니다.
- 핵심 책임: 캐시 키/TTL/저장소 정의 중앙화, 메모리/Redis 저장소 추상화, read-through 캐시 패턴 제공, sliding expiry 지원, 수동 무효화 지원.
- 중요한 전제: 이 모듈은 "멀티 레이어 자동 캐시"가 아니라, 키별로 `MEMORY` 또는 `REDIS` 중 하나를 선택하는 단일 저장소 캐시입니다.

이 문서를 먼저 읽어야 하는 질문
- 이 캐시는 L1/L2 계층형인가, 아니면 단일 저장소 선택형인가?
- 특정 캐시 항목을 `MEMORY`와 `REDIS` 중 어디에 두는 것이 맞는가?
- `getOrSet()`, `getAndTouch()`, `get()` 중 어떤 접근 패턴을 써야 하는가?

관련 sibling 문서
- [PERSISTENCE.md](PERSISTENCE.md) — Redis 캐시를 거친 값의 `bigint`·`Decimal`·`Date` 복원 규칙을 함께 이해할 수 있습니다.
- [THROTTLE.md](THROTTLE.md) — 같은 Redis 기반 카운터/TTL 인프라가 보호 로직에서는 어떻게 쓰이는지 비교할 수 있습니다.
- [ENV.md](ENV.md) — Redis 연결 정보와 환경 설정의 실제 출처를 확인할 수 있습니다.

소스 구성
- [../../src/infrastructure/cache/cache.constants.ts](../../src/infrastructure/cache/cache.constants.ts) — 캐시 키 정의와 TTL/저장소 정책 중앙 관리
- [../../src/infrastructure/cache/cache.service.ts](../../src/infrastructure/cache/cache.service.ts) — 캐시 조회/저장/무효화 공통 서비스
- [../../src/infrastructure/cache/cache.module.ts](../../src/infrastructure/cache/cache.module.ts) — 전역 모듈 등록
- 연동 의존성: [../../src/infrastructure/redis/redis.service.ts](../../src/infrastructure/redis/redis.service.ts)

한눈에 보는 구조
1. 캐시 항목은 `CACHE_CONFIG`에서 정의합니다.
2. 각 항목은 `key`, `ttlSeconds`, `store`를 갖는 `CacheDefinition` 형태를 따릅니다.
3. 애플리케이션 코드는 `CacheService`만 호출하고, 실제 저장 위치는 설정이 결정합니다.
4. `store`가 `MEMORY`면 프로세스 로컬 `Map`을 사용합니다.
5. `store`가 `REDIS`면 `RedisService`를 통해 직렬화/TTL 저장을 수행합니다.

아키텍처 핵심 포인트

## 1. 자동 L1/L2 계층형 캐시는 아님
- 주석에 `L1`, `L2`라는 표현이 일부 보이지만, 현재 구현은 한 요청에서 메모리 후 Redis를 차례로 조회하지 않습니다.
- 각 캐시 키는 오직 하나의 저장소만 사용합니다.
- 예를 들어 `CACHE_CONFIG.USER_CONFIG.GLOBAL`은 메모리 캐시, `CACHE_CONFIG.FILE.URL(...)`은 Redis 캐시입니다.
- 따라서 "메모리 미스 시 Redis fallback" 같은 기능은 현재 없습니다.

이 점이 중요한 이유
- 운영자가 "MEMORY니까 로컬 1차, REDIS가 2차"라고 가정하면 잘못된 설계를 하게 됩니다.
- 실제로는 캐시 전략이 키 정의 시점에 고정됩니다.

## 2. 저장소 종류는 두 가지

### `CacheStore.MEMORY`
- 구현체: `Map<string, { value: any; expiry: number }>`
- 범위: 현재 Nest 프로세스 내부만 공유
- 장점: 매우 빠르고 Redis 네트워크 비용이 없음
- 한계:
  - 멀티 인스턴스 간 공유되지 않음
  - 프로세스 재시작 시 모두 소실됨
  - 만료 데이터가 백그라운드에서 정리되지 않고, 접근 시점에만 만료 검사됨

### `CacheStore.REDIS`
- 구현체: `RedisService`
- 범위: 여러 인스턴스가 공유 가능
- 장점: 분산 환경에서 일관된 캐시 공유 가능
- 특징:
  - JSON 직렬화 후 저장
  - TTL은 밀리초 기반으로 저장
  - 저장 시 TTL jitter가 추가됨

## 3. `CacheModule`은 전역 모듈
- [../../src/infrastructure/cache/cache.module.ts](../../src/infrastructure/cache/cache.module.ts)는 `@Global()`입니다.
- `RedisModule`을 import하고 `CacheService`를 provider/export 합니다.
- 따라서 다른 모듈은 일반적으로 별도 export 체인을 만들지 않고 `CacheService`를 주입받아 사용할 수 있습니다.

파일별 상세 분석

## 1. `cache.constants.ts`

역할
- 캐시 키 이름, TTL, 저장소 선택을 중앙에서 관리합니다.

핵심 타입
- `CacheDefinition`
  - `key: string`
  - `ttlSeconds: number`
  - `store: CacheStore`

설계 특징
- 정적 키와 동적 키를 모두 지원합니다.
- 정적 키 예시:
  - `CACHE_CONFIG.TIER.LIST`
  - `CACHE_CONFIG.PROMOTION.CONFIG`
- 동적 키 팩토리 예시:
  - `CACHE_CONFIG.FILE.URL(fileId)`
  - `CACHE_CONFIG.CASINO.PROVIDER.BY_CODE(aggregatorId, code)`
  - `CACHE_CONFIG.BLOCKCHAIN.SOLANA_BLOCKHASH(slot)`

도메인별 구성 특징
- `TIER`, `PROMOTION`, `COUPON`, `CHARACTER`, `CHAT_CONFIG` 등은 주로 메모리 캐시를 사용합니다.
- `FILE`, `ARTIFACT`, `UNIVERSAL_LOG`, `BLOCKCHAIN`, 일부 `CASINO` 항목은 Redis 캐시를 사용합니다.
- TTL은 도메인 특성에 맞게 세분화되어 있습니다.
  - 예: Solana 현재 슬롯은 `0.7초`
  - 예: 파일 PUBLIC URL은 `24시간`
  - 예: UserConfig 글로벌은 `5초`

실무 의미
- 새 캐시를 추가할 때 키 네이밍 규칙과 TTL/저장소 결정은 여기서 먼저 정의해야 합니다.
- 캐시 전략은 서비스 안에 흩어지지 않고 이 파일에서 중앙 관리됩니다.

## 2. `cache.service.ts`

역할
- 실제 캐시 접근 API를 제공합니다.

내부 상태
- `memoryCache: Map<string, { value: any; expiry: number }>`
- `logger`
- `redisService`

제공 메서드
- `getOrSet(config, source)`
- `get(config)`
- `getAndTouch(config)`
- `set(config, value)`
- `del(config)`

### `getOrSet()` 상세 흐름
1. 먼저 `get()` 호출
2. 값이 있으면 즉시 반환
3. 캐시 조회 중 에러가 나면 경고만 남기고 진행
4. 캐시 미스면 `source()` 실행
5. 결과를 `set()`으로 저장 시도
6. 저장 실패도 경고만 남기고 원본 값 반환

중요한 성질
- 캐시 계층 장애가 비즈니스 로직을 막지 않도록 설계되어 있습니다.
- 즉, 캐시는 best-effort 보조 계층입니다.

주의할 점
- `getOrSet()`은 분산 락이나 in-flight deduplication을 하지 않습니다.
- 같은 키에 대한 동시 다발적 미스가 발생하면 `source()`가 여러 번 실행될 수 있습니다.
- 즉, cache stampede 방지 기능은 현재 없습니다.

### `get()` 상세 흐름
- `MEMORY`
  - `Map`에서 엔트리 조회
  - 엔트리가 없거나 `Date.now() > expiry`면 `null`
  - 유효하면 원본 값을 그대로 반환
- `REDIS`
  - `RedisService.get()` 위임

주의할 점
- 메모리 캐시는 만료 시 `null`만 반환하고 즉시 `delete()` 하지는 않습니다.
- 따라서 장기적으로 많은 키가 생기면 expired entry가 접근 전까지 메모리에 남을 수 있습니다.

### `getAndTouch()` 상세 흐름
- 용도: sliding expiry
- `MEMORY`
  - 현재 값이 살아 있으면 `expiry`를 `now + ttlSeconds`로 갱신
- `REDIS`
  - `RedisService.getAndExpire()` 호출
  - 내부적으로 Redis `GETEX`를 사용하여 조회와 만료 연장을 원자적으로 처리

대표 사용처
- [../../src/modules/universal-log/infrastructure/prisma-user-agent-catalog.repository.ts](../../src/modules/universal-log/infrastructure/prisma-user-agent-catalog.repository.ts)

### `set()` 상세 흐름
- `MEMORY`
  - `Map.set(key, { value, expiry })`
- `REDIS`
  - `RedisService.set(key, value, ttlSeconds)` 위임

### `del()` 상세 흐름
- `MEMORY`
  - `Map.delete(key)`
- `REDIS`
  - `RedisService.del(key)` 위임

## 3. `cache.module.ts`

역할
- 캐시 인프라 등록용 전역 모듈입니다.

구성
- `imports: [RedisModule]`
- `providers: [CacheService]`
- `exports: [CacheService]`

실무 의미
- 캐시 로직은 도메인 서비스가 직접 Redis를 다루지 않고 `CacheService`를 통해 일관되게 접근하도록 유도됩니다.

연동 의존성 분석

## `RedisService`와의 실제 관계
- `CacheService`의 Redis 동작은 [../../src/infrastructure/redis/redis.service.ts](../../src/infrastructure/redis/redis.service.ts)에 위임됩니다.

문서화 시 반드시 알아야 할 포인트

### 1. Redis TTL은 소수점 초를 지원함
- `set()`은 `ttl_sec * 1000`으로 밀리초 TTL을 계산해 `PX`로 저장합니다.
- `getAndExpire()`도 `Math.floor(ttl_sec * 1000)`으로 `GETEX PX`를 사용합니다.
- 그래서 `0.7초` 같은 TTL 설정이 실제로 동작합니다.

### 2. Redis 저장 시 TTL jitter가 자동 적용됨
- `RedisService.set()`은 최대 5%, 최대 120초 범위의 랜덤 jitter를 TTL에 추가합니다.
- 목적: 같은 시각에 대량 키가 동시에 만료되는 현상 방지
- 중요한 차이: 메모리 캐시는 jitter가 없습니다.

### 3. Redis 직렬화/역직렬화 규칙
- serialize 시:
  - `bigint` → 문자열
  - `Decimal` → 문자열
- deserialize 시:
  - ISO Date 문자열만 `Date`로 복원
  - `bigint`, `Decimal`은 자동 복원하지 않음

이로 인한 실무상 주의점
- Redis에 `bigint` 포함 객체를 저장하면 조회 시 문자열로 돌아옵니다.
- 따라서 Redis 기반 캐시를 쓸 때는 호출부에서 타입 복원 책임을 질 수 있어야 합니다.
- 대표 예시:
  - [../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts](../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts)는 캐시 조회 후 `updatedAt`, `updatedBy`를 수동 복원합니다.

중요 리스크
- [../../src/modules/universal-log/infrastructure/prisma-user-agent-catalog.repository.ts](../../src/modules/universal-log/infrastructure/prisma-user-agent-catalog.repository.ts)는 `getAndTouch<bigint>()`를 사용하지만, Redis 역직렬화는 실제 `string`을 반환할 수 있습니다.
- 즉, 타입 선언과 런타임 값이 어긋날 수 있으므로 향후 `bigint` 캐시 사용 시 특별히 주의해야 합니다.

실제 사용 패턴 분석

## 1. Read-through 캐시: `getOrSet()`

대표 예시
- [../../src/modules/file/application/file-url.service.ts](../../src/modules/file/application/file-url.service.ts)
- [../../src/modules/casino/aggregator/infrastructure/casino-aggregator.repository.ts](../../src/modules/casino/aggregator/infrastructure/casino-aggregator.repository.ts)
- [../../src/infrastructure/blockchain/solana/solana.service.ts](../../src/infrastructure/blockchain/solana/solana.service.ts)

패턴
1. 키 정의 선택
2. 캐시에 있으면 즉시 반환
3. 없으면 DB/API/계산 로직 실행
4. 결과 저장 후 반환

적합한 경우
- 조회 비중이 높고 원본 비용이 큰 데이터
- 파일 URL, 마스터 데이터, 외부 API 결과, 설정값

## 2. Sliding Expiry: `getAndTouch()`

대표 예시
- [../../src/modules/universal-log/infrastructure/prisma-user-agent-catalog.repository.ts](../../src/modules/universal-log/infrastructure/prisma-user-agent-catalog.repository.ts)

패턴
1. 자주 조회되는 키를 읽는다
2. 조회 성공 시 만료를 연장한다
3. 캐시 hit가 계속되면 수명이 계속 늘어난다

적합한 경우
- 자주 쓰이는 lookup 캐시
- hot key를 일정 시간 더 유지하고 싶은 경우

## 3. 수동 조회 + 수동 타입 복원: `get()`

대표 예시
- [../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts](../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts)

이 패턴을 쓰는 이유
- 캐시된 값이 plain object일 때 도메인 엔티티/값 객체로 다시 감싸야 하기 때문입니다.
- 특히 `Date`, `bigint` 같은 타입을 직접 복원해야 할 때 `getOrSet()`보다 명시적 제어가 유리합니다.

## 4. Write-through / 갱신 직후 set

대표 예시
- [../../src/modules/promotion/config/infrastructure/promotion-config.repository.ts](../../src/modules/promotion/config/infrastructure/promotion-config.repository.ts)

패턴
1. DB 업데이트 수행
2. 최신 도메인 객체를 바로 캐시에 반영

적합한 경우
- 갱신 직후 조회 일관성을 빠르게 확보하고 싶을 때
- 트랜잭션 외부에서 안전하게 최신 값을 구성할 수 있을 때

## 5. 무효화 중심 전략: `del()`

대표 예시
- [../../src/modules/casino/aggregator/infrastructure/casino-aggregator.repository.ts](../../src/modules/casino/aggregator/infrastructure/casino-aggregator.repository.ts)
- [../../src/modules/character/master/infrastructure/prisma-character-config.repository.ts](../../src/modules/character/master/infrastructure/prisma-character-config.repository.ts)
- [../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts](../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts)

패턴
1. DB 변경 수행
2. 관련 키를 모두 삭제
3. 다음 조회 때 다시 채움

적합한 경우
- 여러 키가 서로 연결되어 있어 한번에 최신값 재구성이 필요한 경우
- 트랜잭션 중간에 잘못된 최신값을 캐시에 넣고 싶지 않은 경우

쿠폰 설정 사례의 의미
- [../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts](../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts)는 업데이트 후 `set` 대신 `del`을 선택합니다.
- 이유는 트랜잭션 커밋 전 상태와 캐시 반영 시점이 어긋나는 문제를 피하기 위해서입니다.

운영상 중요한 포인트
- 메모리 캐시는 각 인스턴스 로컬이므로 다중 서버 환경에서 전역 일관성을 보장하지 않습니다.
- Redis 캐시는 공유되지만 직렬화 타입 손실을 고려해야 합니다.
- `getOrSet()`은 실패를 삼키고 원본을 반환하므로, 캐시 장애가 있어도 서비스는 계속 동작합니다.
- 대신 캐시 장애가 조용히 성능 저하로만 나타날 수 있으므로 모니터링이 중요합니다.
- TTL jitter는 Redis에만 적용됩니다. 메모리 캐시는 동일 TTL이면 동시에 만료될 수 있습니다.
- 메모리 캐시는 프로세스 생명주기에 묶여 있으므로 운영 중 재배포/재시작 시 cold start를 감안해야 합니다.

설계상 주의사항

## 1. 타입 안정성 주의
- `CacheService` 제네릭은 컴파일 타임 힌트일 뿐입니다.
- Redis를 거친 값은 런타임에서 `bigint`, `Decimal`이 문자열로 바뀔 수 있습니다.
- 도메인 객체를 그대로 Redis에 저장하는 경우 복원 책임을 반드시 호출부가 져야 합니다.

## 2. 동시성 주의
- `getOrSet()`은 원자적 캐시 채우기가 아닙니다.
- 동시 요청 폭주 시 동일 source를 여러 번 호출할 수 있습니다.
- 외부 API/고비용 쿼리라면 추가 락 또는 single-flight 패턴이 필요할 수 있습니다.

## 3. 키 무효화 범위 주의
- 하나의 엔티티가 여러 키에 걸쳐 캐싱되면 업데이트 시 관련 키를 모두 삭제해야 합니다.
- 예시: 카지노 aggregator는 ID 키와 CODE 키를 함께 무효화합니다.

## 4. 메모리 캐시 용량 관리 부재
- 현재 `memoryCache`는 최대 크기 제한, LRU, 주기적 sweep이 없습니다.
- 키가 무한정 늘어나는 패턴에는 적합하지 않습니다.
- 현재는 주로 소수의 설정값, 마스터 데이터, 짧은 TTL 캐시에 맞춘 설계입니다.

새 캐시 항목 추가 체크리스트
1. `CACHE_CONFIG`에 키 이름, TTL, 저장소를 먼저 정의
2. 데이터 성격에 따라 `MEMORY`와 `REDIS` 중 하나 선택
3. Redis 사용 시 직렬화 후 타입 손실 가능성 검토
4. 조회 패턴에 맞게 `getOrSet`, `getAndTouch`, `get`, `set`, `del` 중 선택
5. 쓰기 작업 후 어떤 키를 무효화해야 하는지 식별
6. 멀티 인스턴스 환경이면 `MEMORY` 사용 적합성 재검토
7. 외부 API hot key면 TTL과 stampede 가능성을 함께 검토

변경 시 특히 조심할 점
- `CACHE_CONFIG` 키 이름 변경: 기존 운영 캐시 히트율과 무효화 전략에 직접 영향
- `ttlSeconds` 변경: 성능/정합성/비용이 동시에 바뀜
- `CacheStore` 변경: 로컬/분산 동작 모델 자체가 바뀜
- `CacheService.getOrSet()` 변경: 전역 캐시 접근 패턴 전체에 영향
- `RedisService` 직렬화 로직 변경: 캐시 데이터 호환성과 복원 코드에 영향

요약 결론
- 이 캐시 모듈은 단순하지만 프로젝트 전반에 넓게 쓰이는 핵심 인프라입니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - 키별로 단일 저장소를 고르는 구조이지, 자동 2계층 캐시는 아니라는 점
  - Redis 사용 시 타입 복원 문제가 실제로 발생할 수 있다는 점
  - `getOrSet()`은 편하지만 동시성 제어와 타입 복원까지 해결해 주지는 않는다는 점