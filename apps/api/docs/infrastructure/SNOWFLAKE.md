---
module: snowflake
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: infrastructure-module
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - snowflake
  - ids
  - timestamps
  - node-identity
  - external-id-generation
tasks:
  - generate-id
  - debug-id-collision
  - inspect-external-timestamp-flow
relatedDocs:
  - README.md
  - SQIDS.md
  - PERSISTENCE.md
trustLevel: medium
owner: infrastructure-snowflake
reviewResponsibility:
  - review when bit layout, epoch, node-id strategy, or external generation rules change
  - review when `parse()` contract or exception semantics change
  - review when node identity integration changes the generated ID guarantees
sourceRoots:
  - ../../src/infrastructure/snowflake
---

# Snowflake 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/snowflake`

간단 요약
- 목적: 분산 환경에서 정렬 가능하고 충돌 없는 `bigint` 기반 ID를 생성하는 공통 인프라입니다.
- 핵심 책임: 현재 시각 기반 내부 ID 생성, 외부 이벤트 시각 기반 ID 생성, 생성 시각 역추적(`parse`) 기능 제공.
- 이 구현은 일반적인 Snowflake와 비슷하지만, 현재 프로젝트 요구에 맞춰 “외부 시각 주입 모드”를 별도로 지원하는 것이 핵심 차별점입니다.

이 문서를 먼저 읽어야 하는 질문
- 내부 생성과 외부 시각 주입 생성은 어떻게 다른가?
- ID 비트 구조에서 timestamp, nodeId, sequence는 어떻게 나뉘는가?
- `parse()`로 어떤 운영 디버깅 정보를 복원할 수 있는가?

관련 sibling 문서
- [SQIDS.md](SQIDS.md) — 내부 `bigint` ID가 외부 노출용 문자열 ID로 어떻게 이어지는지 바로 다음 단계의 경계를 확인할 수 있습니다.
- [PERSISTENCE.md](PERSISTENCE.md) — Snowflake `bigint`를 DB·캐시 경계에서 안전하게 복원할 때 필요한 타입 규칙을 같이 볼 수 있습니다.
- [PRISMA.md](PRISMA.md) — 생성된 ID가 실제 DB write path에서 어떤 트랜잭션/ORM 경로를 타는지 연결해 볼 수 있습니다.

소스 구성
- [../../src/infrastructure/snowflake/snowflake.service.ts](../../src/infrastructure/snowflake/snowflake.service.ts) — Snowflake 생성/복호화 핵심 로직
- [../../src/infrastructure/snowflake/snowflake.exception.ts](../../src/infrastructure/snowflake/snowflake.exception.ts) — 예외 정의
- [../../src/infrastructure/snowflake/snowflake.module.ts](../../src/infrastructure/snowflake/snowflake.module.ts) — 모듈 등록
- [../../src/infrastructure/snowflake/snowflake.service.spec.ts](../../src/infrastructure/snowflake/snowflake.service.spec.ts) — 핵심 동작 테스트

관련 의존성
- [../../src/infrastructure/node-identity/node-identity.service.ts](../../src/infrastructure/node-identity/node-identity.service.ts) — 노드 ID 공급자
- [../../src/infrastructure/node-identity/node-identity.module.ts](../../src/infrastructure/node-identity/node-identity.module.ts) — 전역 NodeIdentity 모듈

대표 사용처
- 내부 현재 시각 기반 ID 생성
  - [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
  - [../../src/modules/notification/alert/application/create-alert.service.ts](../../src/modules/notification/alert/application/create-alert.service.ts)
  - [../../src/modules/universal-log/application/create-universal-log.service.ts](../../src/modules/universal-log/application/create-universal-log.service.ts)
  - [../../src/modules/tier/audit/application/record-tier-history.service.ts](../../src/modules/tier/audit/application/record-tier-history.service.ts)
- 외부 이벤트 시각 기반 ID 생성
  - [../../src/modules/game-round/application/resolve-game-round.service.ts](../../src/modules/game-round/application/resolve-game-round.service.ts)
- ID에서 생성 시각 복원
  - [../../src/modules/notification/inbox/controllers/user/inbox-user.controller.ts](../../src/modules/notification/inbox/controllers/user/inbox-user.controller.ts)
  - [../../src/modules/casino/infrastructure/queue/processors/game-result-fetch.processor.ts](../../src/modules/casino/infrastructure/queue/processors/game-result-fetch.processor.ts)

한눈에 보는 구조
1. `NodeIdentityService`가 각 인스턴스의 node ID를 제공합니다.
2. `SnowflakeService.generate()`는 내부 생성인지 외부 시각 주입 생성인지 구분합니다.
3. 내부 생성은 현재 시스템 시계를 기준으로, 외부 생성은 전달된 시각을 기준으로 ID를 만듭니다.
4. `parse(id)`는 생성 시각, 노드 ID, 외부 생성 여부, 시퀀스를 다시 복원합니다.

비트 구조

현재 구현의 조합식은 다음과 같습니다.

```ts
((timestamp - EPOCH) << 22) | (nodeId << 12) | sequence
```

비트 의미
- 하위 12비트: sequence
- 그 위 10비트: nodeId
- 나머지 상위 비트: custom epoch 기준 timestamp

관련 상수
- `EPOCH = 1767225600000n` → `2026-01-01T00:00:00.000Z`
- `NODE_ID_SHIFT = 12n`
- `TIMESTAMP_SHIFT = 22n`
- `SEQUENCE_MASK = 0xfffn` → 4095
- `NODE_ID_MASK = 0x3ffn` → 1023
- `EXTERNAL_NODE_OFFSET = 512n`

핵심 개념

## 1. 내부 생성과 외부 생성이 분리되어 있음
- `generate()`에 인자가 없으면 내부 생성 모드입니다.
- `generate(targetTime)`처럼 인자를 주면 외부 생성 모드입니다.
- 이 둘은 같은 Snowflake 비트 공간을 쓰지만, node ID 구간을 나눠 충돌을 피하려는 설계를 택합니다.

## 2. 생성 시각을 함께 반환함
- `generate()`는 단순히 `id`만 반환하지 않고 `{ id, timestamp }`를 반환합니다.
- 그래서 호출부는 생성 즉시 같은 시각을 도메인 이벤트 시간으로 함께 저장할 수 있습니다.

이 점이 중요한 이유
- `Date.now()`를 다시 한 번 부르면 ID 안에 들어간 시각과 미세하게 달라질 수 있습니다.
- 현재 구현은 이 문제를 방지하려고 생성 시각을 아예 같이 반환합니다.

파일별 상세 분석

## 1. `snowflake.service.ts`

역할
- Snowflake 생성 및 복호화를 모두 담당하는 핵심 서비스입니다.

### `getNodeId()`
- `NodeIdentityService.getNodeId()`를 읽고 하위 9비트만 사용합니다.

```ts
BigInt(this.nodeIdentityService.getNodeId()) & 0x1ffn
```

의미
- 내부 생성용 node ID는 `0~511` 범위만 사용합니다.
- 외부 생성용은 여기에 `EXTERNAL_NODE_OFFSET = 512`를 OR 해서 `512~1023` 구간으로 올립니다.

### `generate(targetTime?)`

동작 분기
- `targetTime === undefined`
  - 내부 생성 모드
  - 현재 시각 `Date.now()` 사용
- `targetTime`이 주어짐
  - 외부 생성 모드
  - 전달 시각을 그대로 사용

입력 허용 타입
- `Date`
- `number`
- `bigint`

반환 타입
- `GeneratedSnowflake = { id: bigint; timestamp: Date }`

### 내부 생성: `internalGenerate(timestamp)`

목적
- 현재 서버 시계를 기준으로 단조 증가하는 ID를 생성합니다.

동작 순서
1. 현재 timestamp가 `lastTimestamp`보다 과거인지 검사
2. 과거라면 clock rollback 처리
3. 같은 밀리초면 sequence 증가
4. sequence overflow면 다음 밀리초까지 대기
5. `lastTimestamp` 갱신 후 ID 조합

#### Clock rollback 처리
- `timestamp < lastTimestamp`인 경우:
  - 차이가 `2000ms` 미만이면 경고 로그 후 `waitNextMillis()`로 다음 시각까지 대기
  - 차이가 `2000ms` 이상이면 `SnowflakeClockBackwardsException` 발생

의미
- 작은 clock skew는 흡수하려 하고, 큰 skew는 명시적 장애로 취급합니다.

#### 같은 밀리초 처리
- 같은 millisecond 내 재호출이면 `sequence`를 증가시킵니다.
- 최대값은 `4095`입니다.
- `4096번째` 요청이 오면 sequence가 `0`으로 돌아가므로, 충돌 방지를 위해 다음 millisecond까지 busy-wait 합니다.

### 외부 생성: `generateExternal(timestamp)`

목적
- 외부 시스템이 보낸 이벤트 시각으로 ID를 생성합니다.
- 이벤트가 순서대로 오지 않아도 같은 timestamp 안에서 충돌을 피하려고 설계되어 있습니다.

동작 순서
1. 내부 node ID를 읽음
2. `EXTERNAL_NODE_OFFSET`를 OR 하여 외부 생성용 node ID 범위로 이동
3. `externalSequenceMap`에서 해당 timestamp의 마지막 sequence 조회
4. 다음 sequence 계산 후 map 갱신
5. map 크기가 1000을 넘으면 가장 오래된 timestamp key 제거
6. ID 조합

핵심 설계 포인트
- 외부 생성은 `lastTimestamp`를 사용하지 않습니다.
- 즉, `T1 -> T2 -> T1`처럼 out-of-order 도착이 와도 동일 timestamp에 대한 sequence를 기억합니다.
- 테스트도 이 동작을 검증합니다.

### `buildIdWithNode(timestamp, sequence, nodeId)`
- 실제 비트 조합을 수행하는 공통 헬퍼입니다.

### `waitNextMillis(lastTimestamp)`
- `Date.now()`를 반복 호출하면서 다음 millisecond까지 busy-spin 합니다.
- 내부 생성의 sequence overflow 또는 작은 clock rollback 회복에 사용됩니다.

### `parse(id)`

복원 정보
- `timestamp`
- `date`
- `nodeId`
- `isExternal`
- `sequence`

동작 방식
1. 상위 비트에서 timestamp 복원
2. node bits 추출
3. `EXTERNAL_NODE_OFFSET` bit가 켜져 있으면 `isExternal = true`
4. 외부 생성이면 offset bit를 XOR 하여 원래 node ID로 되돌림
5. 하위 12비트에서 sequence 추출

실무 의미
- ID만 있어도 생성 시각을 역산할 수 있습니다.
- 이 특성 때문에 일부 코드에서는 별도 createdAt 컬럼 없이도 파티션 키나 조회 범위를 계산합니다.

## 2. `snowflake.module.ts`

역할
- `SnowflakeService`를 provider/export 하는 일반 Nest 모듈입니다.

중요한 관찰
- `@Global()`이 아닙니다.
- 따라서 사용하는 기능 모듈이 직접 import해야 합니다.
- 다만 `NodeIdentityService`는 전역 모듈([../../src/infrastructure/node-identity/node-identity.module.ts](../../src/infrastructure/node-identity/node-identity.module.ts))에서 제공되므로, `SnowflakeModule` 자체는 별도 import 없이도 그 의존성을 주입받을 수 있습니다.

## 3. `snowflake.exception.ts`

정의된 예외
- `SnowflakeException`
- `SnowflakeNodeIdOccupiedException`
- `SnowflakeNodeIdNotAssignedException`
- `SnowflakeClockBackwardsException`

현재 실사용 관찰
- `SnowflakeClockBackwardsException`은 실제 `SnowflakeService`에서 사용됩니다.
- 반면 `SnowflakeNodeIdOccupiedException`, `SnowflakeNodeIdNotAssignedException`은 현재 검색 기준 사용처가 보이지 않습니다.
- 실제 노드 ID 할당 실패/미할당은 현재 [../../src/infrastructure/node-identity/node-identity.service.ts](../../src/infrastructure/node-identity/node-identity.service.ts)에서 일반 `Error`로 처리합니다.

## 4. `snowflake.service.spec.ts`

검증되는 항목
- `generate()` 반환 구조
- 내부 생성 시 ID 증가 보장
- `parse()`와 `timestamp` 일치성
- 작은 clock skew 회복
- 큰 clock skew 예외 발생
- 외부 시각 주입 생성
- 외부/내부 node bit 분리
- 과거 시각 허용
- out-of-order external event 처리

테스트에서 드러나는 설계 의도
- 이 구현은 단순 “현재 시간 기반 Snowflake”가 아니라, 외부 이벤트 타임라인을 보존하는 ID 생성기라는 점을 명확히 보여 줍니다.

런타임 사용 패턴 분석

## 1. 현재 시각 기반 일반 생성

대표 예시
- [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
- [../../src/modules/notification/alert/application/create-alert.service.ts](../../src/modules/notification/alert/application/create-alert.service.ts)
- [../../src/modules/universal-log/application/create-universal-log.service.ts](../../src/modules/universal-log/application/create-universal-log.service.ts)

패턴
1. `const { id, timestamp } = this.snowflakeService.generate()`
2. `id`는 PK/식별자 사용
3. `timestamp`는 createdAt/event time에 사용

의미
- ID와 시간 필드가 같은 기준 시각을 공유합니다.

## 2. 외부 이벤트 시각 기반 생성

대표 예시
- [../../src/modules/game-round/application/resolve-game-round.service.ts](../../src/modules/game-round/application/resolve-game-round.service.ts)

패턴
1. 외부 제공 이벤트 시각(`triggerTime`)을 그대로 `generate(triggerTime)`에 전달
2. 생성된 ID가 외부 이벤트 시간축을 보존하도록 함

이 설계가 중요한 이유
- 나중에 `parse(id)`만으로도 라운드 시작 시각을 복원할 수 있습니다.
- 파티셔닝, 시간창 조회, 후처리 작업에 유리합니다.

## 3. `parse()`로 생성 시각 역추적

대표 예시
- [../../src/modules/notification/inbox/controllers/user/inbox-user.controller.ts](../../src/modules/notification/inbox/controllers/user/inbox-user.controller.ts)
- [../../src/modules/casino/infrastructure/queue/processors/game-result-fetch.processor.ts](../../src/modules/casino/infrastructure/queue/processors/game-result-fetch.processor.ts)

패턴
1. 외부 노출 ID를 decode하여 원래 `bigint` ID 획득
2. `snowflakeService.parse(decodedId)` 호출
3. `date`를 createdAt 또는 파티션 키로 사용

의미
- 저장소가 Snowflake timestamp 기반 파티션/윈도우 조회를 사용할 때 매우 유용합니다.

중요 관찰 및 주의사항

## 1. 실효 노드 공간은 512개로 보임
- `NodeIdentityService`는 `0~1023` 범위 node ID를 할당할 수 있습니다.
- 그러나 `SnowflakeService.getNodeId()`는 하위 9비트(`0~511`)만 사용합니다.
- 외부 생성은 여기에 `512` bit를 더해 raw node bits `512~1023`를 사용합니다.

코드 기반 해석
- Snowflake 관점에서 내부 고유 노드 공간은 사실상 512개입니다.
- 만약 `NodeIdentityService`가 `512` 이상 값을 할당하면, Snowflake 내부 node bit는 하위 9비트만 남으므로 다른 노드와 충돌할 수 있습니다.

[주의]
- 현재 코드 기준으로 이 제한을 강제하는 보호 로직은 보이지 않습니다.
- 따라서 인프라 운영 측에서 Snowflake를 사용하는 인스턴스 node ID 범위를 실제로 어떻게 제한하는지 별도 확인이 필요합니다.

## 2. 외부 과거 시각은 음수 ID를 만들 수 있음
- custom epoch가 `2026-01-01`입니다.
- 따라서 `2026` 이전 시각으로 `generate(targetTime)`를 호출하면 `(timestamp - EPOCH)`가 음수가 됩니다.
- 이 경우 생성되는 `bigint` ID도 음수가 될 수 있습니다.

실무 의미
- 테스트는 과거 시각 생성 자체를 허용합니다.
- 하지만 downstream 시스템이 “ID는 항상 양수”라고 가정한다면 문제가 될 수 있습니다.
- 예를 들어 양수 ID 전제 인코더나 외부 계약이 있다면 별도 검토가 필요합니다.

## 3. 외부 생성은 같은 timestamp에서 4096개를 넘으면 충돌 가능
- `generateExternal()`은 sequence를 `0~4095`로 순환시키지만, overflow 시 내부 생성처럼 다음 millisecond로 기다리지 않습니다.
- 즉, 동일한 external timestamp에 대해 한 노드가 4096개를 초과해 생성하면 sequence가 다시 `0`이 되어 충돌 가능성이 생깁니다.

[주의]
- 현재 테스트는 out-of-order는 검증하지만, external overflow는 검증하지 않습니다.
- 대량 backfill이나 동일 시각 이벤트 폭주가 가능한 도메인이라면 이 제한을 반드시 고려해야 합니다.

## 4. `waitNextMillis()`는 busy-spin
- 내부 생성의 작은 rollback 회복과 sequence overflow 시 CPU를 점유하며 다음 millisecond까지 기다립니다.
- 보통 짧은 시간이지만, 고부하 환경에서는 이 동작 특성을 알아두는 편이 좋습니다.

## 5. 일부 예외 클래스는 현재 미사용
- `SnowflakeNodeIdOccupiedException`
- `SnowflakeNodeIdNotAssignedException`

의미
- 예외 설계와 실제 런타임 오류 경로가 완전히 일치하지 않습니다.
- 현재는 `NodeIdentityService`의 일반 `Error`가 더 직접적인 실패 원인입니다.

새 작업 시 체크리스트
1. ID가 현재 시각 기준이어야 하는지, 외부 이벤트 시각 기준이어야 하는지 먼저 결정
2. 현재 시각이면 `generate()`, 외부 이벤트면 `generate(targetTime)` 사용
3. 생성 직후 `timestamp`를 함께 저장할지, 나중에 `parse()`로 복원할지 결정
4. 외부 과거 데이터 백필이면 epoch 이전 시각으로 인한 음수 ID 가능성 검토
5. 외부 동일 timestamp 대량 생성 가능성이 있으면 sequence overflow 리스크 검토
6. node ID 충돌 가능성이 없는지 인프라 운영 정책 확인

변경 시 특히 조심할 점
- `EPOCH` 변경: 기존 ID의 parse 결과와 정렬 의미 전체가 바뀜
- bit shift/mask 변경: 기존 ID 해석 호환성 전체가 깨짐
- `EXTERNAL_NODE_OFFSET` 변경: 내부/외부 생성 충돌 방지 규칙이 바뀜
- `getNodeId()` 마스킹 변경: 분산 고유성에 직접 영향
- `generateExternal()` 시퀀스 로직 변경: 과거 이벤트/backfill 안정성에 영향

요약 결론
- 이 Snowflake 모듈은 단순 ID 생성기가 아니라, “분산 고유성 + 시간 복원 가능성 + 외부 이벤트 시각 보존”을 동시에 달성하려는 인프라입니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - 내부 생성과 외부 시각 주입 생성이 node bit 구간을 나눠서 동작한다는 점
  - `generate()`가 `id`와 `timestamp`를 함께 반환해 시간 정합성을 보장한다는 점
  - 현재 코드 기준으로는 `512개 노드 제한`, `epoch 이전 음수 ID`, `external overflow` 같은 운영상 주의 지점이 분명히 존재한다는 점