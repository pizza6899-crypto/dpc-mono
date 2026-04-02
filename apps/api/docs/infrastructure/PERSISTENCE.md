# Persistence 유틸 가이드

경로: `apps/api/src/infrastructure/persistence/persistence.util.ts`

간단 요약
- 목적: Prisma/Redis/JSON 경계에서 변형될 수 있는 타입을 도메인 계층에서 안전하게 복원하기 위한 공통 유틸입니다.
- 핵심 책임: `bigint`, `Prisma.Decimal`, `Date` 같은 영속성 경계 민감 타입의 복원 규칙을 표준화하고, 컴파일 타임에 “영속화 친화 타입”을 표현할 수 있게 합니다.
- 이 파일은 모듈은 아니지만, 도메인 `fromPersistence()`와 인프라 mapper에서 매우 자주 쓰이는 핵심 경계 유틸입니다.

소스 구성
- [../../src/infrastructure/persistence/persistence.util.ts](../../src/infrastructure/persistence/persistence.util.ts) — 전체 구현 파일

관련 연동 지점
- [../../src/infrastructure/redis/redis.service.ts](../../src/infrastructure/redis/redis.service.ts) — Redis 직렬화/역직렬화 경계
- [../../src/modules/tier/config/domain/tier.entity.ts](../../src/modules/tier/config/domain/tier.entity.ts) — `PersistenceOf` + `Cast` 사용 예시
- [../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts](../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts) — mapper 계층 사용 예시
- [../../src/modules/chat/rooms/infrastructure/chat-message.mapper.ts](../../src/modules/chat/rooms/infrastructure/chat-message.mapper.ts) — 간단한 필드 복원 예시
- [../../src/modules/chat/config/domain/chat-config.entity.ts](../../src/modules/chat/config/domain/chat-config.entity.ts) — `Date` 복원 예시
- [../../src/modules/character/master/infrastructure/level-definition.mapper.ts](../../src/modules/character/master/infrastructure/level-definition.mapper.ts) — `Decimal` 복원 예시
- [../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts](../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts) — 유틸만으로 부족할 때 수동 복원하는 예시

한눈에 보는 구조
1. DB 또는 Redis에서 읽어 온 값은 `bigint`, `Decimal`, `Date`가 문자열/숫자/plain object로 변형될 수 있습니다.
2. `PersistenceOf<T>`는 이런 “영속화된 형태”를 타입 수준에서 허용합니다.
3. `Cast`는 실제 런타임에서 각 필드를 도메인 타입으로 복원합니다.
4. 결과적으로 repository/mapper/domain entity가 영속성 계층과 도메인 계층 사이의 타입 차이를 명시적으로 다룰 수 있게 됩니다.

핵심 개념

## 1. 이 유틸은 자동 직렬화 엔진이 아니다
- 이름 때문에 전체 객체를 자동으로 serialize/deserialize 해주는 유틸처럼 보일 수 있습니다.
- 하지만 실제 구현은 다음 두 가지뿐입니다.
  - `Cast`: 개별 필드 복원 함수 모음
  - `PersistenceOf<T>`: 타입 변환용 mapped type
- 즉, 런타임에서 객체 전체를 재귀적으로 자동 복원하지 않습니다.
- 실제 복원은 각 `fromPersistence()` 또는 mapper에서 필드별로 명시적으로 수행합니다.

## 2. 이 유틸의 진짜 위치는 “경계 계층”이다
- 도메인 엔티티는 `bigint`, `Decimal`, `Date`를 강한 타입으로 쓰고 싶어 합니다.
- 반면 DB/Redis/JSON은 이 타입들을 그대로 보존하지 못할 수 있습니다.
- 이 유틸은 그 차이를 흡수하는 “persistence boundary adapter” 역할을 합니다.

파일별 상세 분석

## `persistence.util.ts`

구성 요소는 두 가지입니다.

### 1. `Cast`

역할
- 런타임 값 하나를 원하는 도메인 타입으로 복원합니다.

제공 메서드
- `Cast.bigint(v)`
- `Cast.decimal(v)`
- `Cast.date(v)`

#### `Cast.bigint(v)`
- 입력: `bigint | string | number | null | undefined`에 가까운 형태
- 동작:
  - `null`/`undefined`면 그대로 반환
  - 이미 `bigint`면 그대로 반환
  - 아니면 `BigInt(v)`로 변환

대표 사용처
- [../../src/modules/chat/rooms/infrastructure/chat-message.mapper.ts](../../src/modules/chat/rooms/infrastructure/chat-message.mapper.ts)
- [../../src/modules/tier/config/domain/tier.entity.ts](../../src/modules/tier/config/domain/tier.entity.ts)

#### `Cast.decimal(v)`
- 입력: `Prisma.Decimal | string | number | null | undefined`에 가까운 형태
- 동작:
  - `null`/`undefined`면 그대로 반환
  - 이미 `Prisma.Decimal`이면 그대로 반환
  - 아니면 `new Prisma.Decimal(v)`로 변환

대표 사용처
- [../../src/modules/tier/config/domain/tier.entity.ts](../../src/modules/tier/config/domain/tier.entity.ts)
- [../../src/modules/character/master/infrastructure/level-definition.mapper.ts](../../src/modules/character/master/infrastructure/level-definition.mapper.ts)

#### `Cast.date(v)`
- 입력: `Date | string | null | undefined`에 가까운 형태
- 동작:
  - `null`/`undefined`면 그대로 반환
  - 이미 `Date`면 그대로 반환
  - 아니면 `new Date(v)`로 변환

대표 사용처
- [../../src/modules/chat/config/domain/chat-config.entity.ts](../../src/modules/chat/config/domain/chat-config.entity.ts)
- [../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts](../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts)

### 2. `PersistenceOf<T>`

역할
- “원래 도메인/Prisma 타입 `T`가 persistence 경계를 통과하며 어떤 형태로 바뀔 수 있는가”를 타입 수준에서 표현합니다.

변환 규칙
- `bigint -> bigint | string`
- `Prisma.Decimal -> Prisma.Decimal | string | number`
- `Date -> Date | string`
- 배열이면 내부 원소를 재귀적으로 `PersistenceOf<U>`로 변환
- 객체면 재귀적으로 각 필드에 동일 규칙 적용

이 타입이 필요한 이유
- Prisma raw payload를 그대로 넘기면 DB에서는 `Decimal`이 유지되더라도, Redis/JSON 경계를 통과한 값은 문자열이 될 수 있습니다.
- `PersistenceOf<T>`를 쓰면 `fromPersistence()` 시그니처가 이런 변형을 타입 차원에서 허용합니다.

대표 사용처
- [../../src/modules/tier/config/domain/tier.entity.ts](../../src/modules/tier/config/domain/tier.entity.ts)
- [../../src/modules/chat/config/domain/chat-config.entity.ts](../../src/modules/chat/config/domain/chat-config.entity.ts)
- [../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts](../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts)

런타임 흐름 분석

## 1. Prisma -> Domain
- Prisma가 반환한 payload를 도메인 엔티티로 바꿀 때 사용됩니다.
- 이 경우 실제 값이 이미 `bigint`, `Decimal`, `Date`일 수도 있으므로 `Cast`는 idempotent하게 동작합니다.

예시
- [../../src/modules/tier/config/domain/tier.entity.ts](../../src/modules/tier/config/domain/tier.entity.ts)
- `data.id`, `data.upgradeExpRequired`, `data.updatedBy`는 `Cast.bigint(...)`
- 각 보너스/비율 값은 `Cast.decimal(...)`
- `updatedAt`은 `Cast.date(...)`

의미
- DB에서 바로 온 값과 캐시에서 복원된 값을 같은 `fromPersistence()` 경로로 처리할 수 있습니다.

## 2. Redis/JSON -> Domain
- Redis는 직렬화 과정에서 `bigint`와 `Decimal`을 문자열로 바꿉니다.
- [../../src/infrastructure/redis/redis.service.ts](../../src/infrastructure/redis/redis.service.ts) 기준으로:
  - serialize 시 `bigint`, `Decimal`은 `toString()` 처리
  - deserialize 시 ISO `Date` 문자열만 `Date`로 복원
  - `bigint`와 `Decimal`은 자동 복원하지 않음

그래서 필요한 것
- Redis를 거친 데이터를 domain으로 올릴 때는 `Cast.bigint`, `Cast.decimal`이 필수입니다.
- `Date`는 Redis reviver가 이미 복원할 수 있지만, `Cast.date`를 거치면 DB 경로와 Redis 경로를 같은 코드로 처리할 수 있습니다.

## 3. Cache 재수화에서 유틸만으로 충분하지 않을 때
- [../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts](../../src/modules/coupon/config/infrastructure/coupon-config.repository.ts)는 캐시 hit 시 수동 복원을 합니다.
- 여기서:
  - `updatedAt: new Date(cached.updatedAt)`
  - `updatedBy: cached.updatedBy ? BigInt(cached.updatedBy) : null`

의미
- 이 유틸은 강력하지만, 모든 복원을 자동 대체하지는 않습니다.
- 특정 aggregate는 repository나 entity에서 별도 복원 로직을 유지하기도 합니다.

실제 사용 패턴 분석

## 1. 도메인 엔티티의 `fromPersistence()` 시그니처에 사용

대표 예시
- [../../src/modules/tier/config/domain/tier.entity.ts](../../src/modules/tier/config/domain/tier.entity.ts)
- [../../src/modules/chat/config/domain/chat-config.entity.ts](../../src/modules/chat/config/domain/chat-config.entity.ts)

패턴
1. `static fromPersistence(data: PersistenceOf<RawPayload>)`
2. 내부에서 필요한 필드만 `Cast`로 복원
3. domain constructor 호출

장점
- entity 레벨에서 persistence 경계를 명시적으로 드러냅니다.
- DB payload와 캐시 payload를 모두 같은 진입점으로 흡수할 수 있습니다.

## 2. 인프라 mapper의 `toDomain()`에서 사용

대표 예시
- [../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts](../../src/modules/chat/rooms/infrastructure/chat-room.mapper.ts)
- [../../src/modules/chat/rooms/infrastructure/chat-message.mapper.ts](../../src/modules/chat/rooms/infrastructure/chat-message.mapper.ts)
- [../../src/modules/character/master/infrastructure/level-definition.mapper.ts](../../src/modules/character/master/infrastructure/level-definition.mapper.ts)

패턴
1. mapper 입력을 `PersistenceOf<Payload>`로 선언
2. 타입 민감 필드를 `Cast`로 복원
3. 나머지는 plain value로 전달

장점
- mapper가 DB/Cache 양쪽 입력에 대해 더 유연해집니다.

## 3. `toPersistence()`와의 짝

관찰
- 많은 도메인 엔티티는 자체 `toPersistence()`를 가집니다.
- 예시: [../../src/modules/affiliate/code/domain/model/affiliate-code.entity.ts](../../src/modules/affiliate/code/domain/model/affiliate-code.entity.ts)

중요 포인트
- 이 유틸은 `toPersistence()`를 자동으로 생성해 주지 않습니다.
- 즉, "직렬화"는 주로 각 엔티티/mapper가 담당하고, 이 유틸은 그 반대편의 "복원"과 타입 허용 범위를 주로 담당합니다.

## 4. 유틸 사용은 강제 표준이 아니라 권장 표준

관찰
- 레포 전반에는 `fromPersistence()` / `toPersistence()` 패턴이 널리 퍼져 있지만, 모든 엔티티가 `PersistenceOf`를 직접 쓰는 것은 아닙니다.
- 예시: [../../src/modules/affiliate/code/domain/model/affiliate-code.entity.ts](../../src/modules/affiliate/code/domain/model/affiliate-code.entity.ts)는 명시 타입 객체를 직접 받습니다.

의미
- 현재 이 유틸은 전역 규칙이라기보다, 복잡한 타입 변환이 필요한 곳에서 채택되는 실용적 표준에 가깝습니다.

중요 관찰 및 주의사항

## 1. `Cast`는 런타임 관점에서 null-safe지만 타입 선언은 완전히 정직하지 않음
- 예를 들어 `Cast.bigint`의 반환 타입은 `bigint`로 선언되어 있습니다.
- 하지만 실제 구현은 `null`/`undefined`를 그대로 반환합니다.
- `Cast.decimal`, `Cast.date`도 동일합니다.

실무 의미
- 현재 코드는 이 동작을 편의적으로 활용하고 있습니다.
- 예: nullable 필드에 `Cast.bigint(data.updatedBy)`를 그대로 전달

[주의]
- 타입 시스템만 보면 non-null처럼 보이지만, 런타임에서는 null이 나올 수 있습니다.
- 즉, 편의성은 높지만 타입 엄밀성은 다소 희생된 API입니다.

## 2. `PersistenceOf<T>`는 컴파일 타임 전용
- 이 타입은 실제 런타임 검증을 하지 않습니다.
- 즉, `PersistenceOf<T>`를 선언했다고 해서 데이터가 정말 그 구조라는 보장은 없습니다.
- 실제 안전성은 여전히 mapper/entity의 수동 `Cast`와 검증 로직에 달려 있습니다.

## 3. 자동 deep deserialize는 아님
- `PersistenceOf<T>`는 재귀 타입이지만, `Cast`는 개별 값 변환 함수일 뿐입니다.
- 따라서 nested object 전체를 자동으로 한 번에 복원하지 않습니다.
- nested structure가 있으면 mapper/entity에서 필드 단위로 계속 명시해야 합니다.

## 4. 최적 대상은 Prisma payload 같은 객체 그래프
- 이 유틸은 객체 payload와 그 내부 필드 복원에 가장 적합합니다.
- top-level primitive나 특수 클래스 전체를 generic하게 다루기 위한 유틸은 아닙니다.

## 5. 전용 테스트 파일은 보이지 않음
- 검색 기준으로 `persistence.util.ts` 자체를 직접 검증하는 spec 파일은 보이지 않았습니다.
- 현재 신뢰성은 주로 이를 사용하는 entity/mapper들의 테스트에 간접 의존합니다.

새 작업 시 체크리스트
1. DB/Redis 경계를 통과하는 값에 `bigint`, `Decimal`, `Date`가 있는지 먼저 식별
2. `fromPersistence()` 또는 mapper 입력 타입에 `PersistenceOf<T>`를 붙일지 판단
3. nullable 필드는 `Cast` 호출 후 null 가능성을 코드 레벨에서 의식
4. Redis 경유 데이터면 `Decimal`/`bigint`가 문자열로 돌아온다는 점을 전제로 복원
5. `toPersistence()`는 별도로 설계하고, 이 유틸이 자동 생성해 주지 않는다는 점을 기억
6. 복잡한 aggregate면 캐시 재수화에서 수동 복원이 더 명확한지 비교

변경 시 특히 조심할 점
- `Cast.bigint`, `Cast.decimal`, `Cast.date`의 null 처리 변경: 레포 전역 mapper/entity에 영향
- `PersistenceOf<T>` 규칙 변경: 많은 `fromPersistence()` 시그니처와 mapper 입력 타입에 영향
- Redis 직렬화 정책과 함께 변경할 경우: 캐시 복원 경로 전체에 영향

요약 결론
- 이 파일은 작지만, 도메인과 persistence 계층 사이의 타입 경계를 안정화하는 핵심 유틸입니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - `PersistenceOf<T>`는 컴파일 타임 허용 범위를 넓히는 타입 유틸이라는 점
  - 실제 런타임 복원은 `Cast`를 필드별로 명시 호출하는 방식이라는 점
  - Redis/JSON 경계에서 `bigint`와 `Decimal`이 깨지는 문제를 흡수하는 데 이 유틸이 매우 중요하다는 점