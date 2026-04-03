---
module: prisma
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: infrastructure-module
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - prisma
  - transactions
  - kysely
  - cls
  - database-access
tasks:
  - choose-transaction-path
  - debug-prisma-transaction
  - inspect-kysely-usage
relatedDocs:
  - README.md
  - CLS.md
  - CONCURRENCY.md
  - ENV.md
trustLevel: medium
owner: infrastructure-prisma
reviewResponsibility:
  - review when Prisma module wiring, `EXTENDED_PRISMA_CLIENT`, or transactional adapter paths change
  - review when Kysely extension, bootstrap health checks, or connection semantics change
  - review when recommended `PrismaService` vs `PrismaTransaction` usage patterns change
sourceRoots:
  - ../../src/infrastructure/prisma
---

# Prisma 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/prisma`

간단 요약
- 목적: 프로젝트의 기본 데이터 접근 계층으로 Prisma Client를 제공하고, Kysely 확장과 `nestjs-cls` 트랜잭션 프록시를 함께 연결하는 핵심 인프라입니다.
- 핵심 책임: 기본 Prisma 클라이언트 생성, Kysely 확장 클라이언트 제공, CLS 기반 `@Transactional()` / `@InjectTransaction()` 경로의 기반 제공, 애플리케이션 생명주기에 맞춘 DB 연결 관리.
- 현재 프로젝트에서 이 모듈은 단순 ORM 래퍼가 아니라, “Prisma 기본 클라이언트 + 확장 클라이언트 + CLS 트랜잭션 어댑터 진입점” 역할을 동시에 수행합니다.

이 문서를 먼저 읽어야 하는 질문
- 트랜잭션 경계에서 `PrismaService`를 직접 써도 되는가?
- `tx.$kysely`와 `prisma.kysely`는 언제 각각 써야 하는가?
- `EXTENDED_PRISMA_CLIENT`와 CLS 프록시는 왜 필요한가?

관련 sibling 문서
- [CLS.md](CLS.md) — `@Transactional()`과 `@InjectTransaction()`이 어떤 요청 컨텍스트 위에서 성립하는지 함께 이해해야 합니다.
- [CONCURRENCY.md](CONCURRENCY.md) — advisory lock과 global lock이 Prisma 트랜잭션 경계와 어떻게 맞물리는지 이어서 확인할 수 있습니다.
- [PERSISTENCE.md](PERSISTENCE.md) — Prisma payload를 도메인 타입으로 올릴 때 필요한 복원 규칙을 함께 확인할 수 있습니다.
- [ENV.md](ENV.md) — Prisma만 `DATABASE_URL`을 직접 읽는 예외적인 설정 경로를 비교할 수 있습니다.

소스 구성
- [../../src/infrastructure/prisma/prisma.module.ts](../../src/infrastructure/prisma/prisma.module.ts) — 전역 Prisma 모듈, `EXTENDED_PRISMA_CLIENT` provider export
- [../../src/infrastructure/prisma/prisma.service.ts](../../src/infrastructure/prisma/prisma.service.ts) — Prisma Client 본체, Kysely 확장, 생명주기 훅
- [../../src/infrastructure/prisma/cls.module.spec.ts](../../src/infrastructure/prisma/cls.module.spec.ts) — Prisma/CLS 연결 테스트
- [../../src/infrastructure/prisma/prisma.module.spec.ts](../../src/infrastructure/prisma/prisma.module.spec.ts) — Prisma 모듈 연결 테스트

관련 연동 지점
- [../../src/infrastructure/cls/cls.module.ts](../../src/infrastructure/cls/cls.module.ts) — `TransactionalAdapterPrisma`가 `EXTENDED_PRISMA_CLIENT`를 사용
- [../../src/app.module.ts](../../src/app.module.ts) — `PrismaModule` import
- [../../src/cli/cli.module.ts](../../src/cli/cli.module.ts) — CLI 컨텍스트에서도 PrismaModule import
- [../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts](../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts) — `@InjectTransaction()` 기반 대표 리포지토리
- [../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts](../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts) — `tx.$kysely` 사용 대표 리포지토리
- [../../src/infrastructure/concurrency/advisory-lock.service.ts](../../src/infrastructure/concurrency/advisory-lock.service.ts) — 트랜잭션 프록시 기반 raw SQL/Kysely 사용
- [../../src/infrastructure/concurrency/concurrency.service.ts](../../src/infrastructure/concurrency/concurrency.service.ts) — 의도적으로 `PrismaService` 직접 사용

대표 사용처
- 권장 트랜잭션 경로: 서비스 `@Transactional()` + 리포지토리 `@InjectTransaction()`
  - [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
  - [../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts](../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts)
  - [../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts](../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts)
- 직접 `PrismaService` 사용 경로
  - [../../src/modules/reward/core/application/get-user-rewards.service.ts](../../src/modules/reward/core/application/get-user-rewards.service.ts)
  - [../../src/modules/reward/core/application/get-admin-rewards.service.ts](../../src/modules/reward/core/application/get-admin-rewards.service.ts)
  - [../../src/modules/exchange/application/exchange-rate.service.ts](../../src/modules/exchange/application/exchange-rate.service.ts)
  - [../../src/modules/audit-log/infrastructure/audit-log.adapter.ts](../../src/modules/audit-log/infrastructure/audit-log.adapter.ts)
  - [../../src/cli/commands/create-admin.command.ts](../../src/cli/commands/create-admin.command.ts)
  - [../../src/infrastructure/concurrency/concurrency.service.ts](../../src/infrastructure/concurrency/concurrency.service.ts)

한눈에 보는 구조
1. `PrismaService`가 기본 Prisma Client를 생성합니다.
2. 생성자에서 같은 엔진 위에 Kysely 확장 클라이언트를 즉시 만듭니다.
3. `PrismaModule`은 이 확장 클라이언트를 `EXTENDED_PRISMA_CLIENT` 토큰으로 export 합니다.
4. [../../src/infrastructure/cls/cls.module.ts](../../src/infrastructure/cls/cls.module.ts)의 `TransactionalAdapterPrisma`가 그 토큰을 받아 CLS 트랜잭션 프록시를 구성합니다.
5. 서비스는 가능하면 `@Transactional()`을 선언하고, 리포지토리는 `@InjectTransaction()`으로 `PrismaTransaction`을 주입받습니다.
6. 일부 읽기/CLI/비트랜잭션/프록시 우회가 필요한 경로에서는 `PrismaService`를 직접 사용합니다.

아키텍처 핵심 포인트

## 1. 진짜 트랜잭션 경로는 `PrismaService`가 아니라 `EXTENDED_PRISMA_CLIENT`
- [../../src/infrastructure/cls/cls.module.ts](../../src/infrastructure/cls/cls.module.ts)의 transactional plugin은 `prismaInjectionToken: EXTENDED_PRISMA_CLIENT`를 사용합니다.
- 즉, `@Transactional()`과 `@InjectTransaction()`은 PrismaService 인스턴스 자체가 아니라, 그 위에 얹힌 확장 클라이언트 경로를 통해 동작합니다.

실무 의미
- 트랜잭션 경계 안에서 기본 원칙은 `PrismaService` 직접 사용이 아니라, `@InjectTransaction()`으로 주입받은 `PrismaTransaction`을 써야 한다는 것입니다.

## 2. `PrismaTransaction`은 raw Prisma tx가 아니라 확장 클라이언트 타입이다
- [../../src/infrastructure/prisma/prisma.service.ts](../../src/infrastructure/prisma/prisma.service.ts)에서 `PrismaTransaction = ExtendedClient`로 선언합니다.
- 그래서 리포지토리에서 `tx.user.findUnique(...)`뿐 아니라 `tx.$kysely`, `tx.$executeRaw` 같은 확장 API도 함께 사용할 수 있습니다.

실무 의미
- 현재 프로젝트의 리포지토리는 “Prisma delegate + Kysely + raw SQL”을 같은 트랜잭션 컨텍스트에서 혼합할 수 있습니다.

## 3. `PrismaService` 직접 사용은 가능하지만, 의도를 분명히 해야 한다
- 직접 `PrismaService`를 주입받는 경로는 실제로 존재합니다.
- 하지만 그것이 자동으로 CLS 트랜잭션에 참여하는 것은 아닙니다.

현재 코드 기준 직접 사용이 합리적인 대표 경우
- 단순 조회/페이지네이션 서비스
- CLI 명령
- 감사 로그 같은 독립 어댑터
- 트랜잭션 프록시를 의도적으로 우회해야 하는 글로벌 락 관리

## 4. `PrismaModule`이 실질적인 공개 진입점이다
- `PrismaModule`은 `@Global()`입니다.
- 동시에 `CustomClsModule`도 함께 export 합니다.
- 그래서 이 프로젝트에서는 PrismaModule import가 사실상 “Prisma + CLS 트랜잭션 기반”을 함께 활성화하는 진입점입니다.

## 5. 기본 클라이언트와 확장 클라이언트가 공존한다
- `PrismaService` 자신은 `PrismaClient`를 상속한 기본 클라이언트입니다.
- 동시에 내부 `_extendedClient`는 `$extends(kyselyExtension(...))`를 적용한 별도 객체입니다.

실무 의미
- `prisma.user.findMany()`와 `prisma.kysely.selectFrom(...)`는 같은 서비스 인스턴스에서 제공되지만, 의미는 다릅니다.
- `prisma.kysely`는 base extended client 기반이고, 트랜잭션 공유가 필요하면 `tx.$kysely`를 써야 합니다.

파일별 상세 분석

## 1. `prisma.module.ts`

역할
- Prisma 인프라를 전역 모듈로 export 합니다.

구성
- `@Global()`
- `imports: [CustomClsModule]`
- provider: `PrismaService`
- provider: `EXTENDED_PRISMA_CLIENT`
- exports: `PrismaService`, `EXTENDED_PRISMA_CLIENT`, `CustomClsModule`

### `EXTENDED_PRISMA_CLIENT` provider
- factory는 `prismaService.extended`를 그대로 반환합니다.

의미
- CLS transactional plugin은 바로 이 토큰을 통해 확장 클라이언트를 주입받습니다.
- 즉, 모듈 export 목록 중 가장 중요한 것은 사실 `PrismaService` 하나가 아니라 `EXTENDED_PRISMA_CLIENT`도 포함된다는 점입니다.

## 2. `prisma.service.ts`

역할
- 프로젝트의 기본 DB 클라이언트이자 Kysely 확장 진입점입니다.

### 클래스 구조
- `PrismaClient<Prisma.PrismaClientOptions>` 상속
- `OnModuleInit`, `OnModuleDestroy` 구현
- 내부 상태: `_extendedClient`

### 생성자

주요 동작
1. `process.env.DATABASE_URL`을 직접 읽음
2. 앞뒤 따옴표 제거
3. 비어 있으면 즉시 throw
4. `PrismaPg` adapter 생성
5. `super({ adapter })`로 PrismaClient 초기화
6. `createExtendedClient()`를 호출해 `_extendedClient` 즉시 생성

중요한 관찰
- 이 서비스는 [../../src/infrastructure/env/env.service.ts](../../src/infrastructure/env/env.service.ts)를 사용하지 않습니다.
- `DATABASE_URL`은 환경 설정 인프라를 우회하여 직접 `process.env`에서 읽습니다.

실무 의미
- Prisma 연결 문자열은 현재 EnvModule의 타입화된 facade 범위 밖에 있습니다.
- Docker `--env-file` 따옴표 이슈를 여기서 직접 흡수하려는 의도가 보입니다.

### `createExtendedClient()`

역할
- Kysely 확장 클라이언트를 생성합니다.

구성 요소
- `prisma-extension-kysely`
- `Kysely<DB>`
- `PostgresAdapter`, `PostgresIntrospector`, `PostgresQueryCompiler`
- `CamelCasePlugin`

의미
- Prisma 엔진 위에 Kysely를 얹어서 raw SQL/복잡한 upsert/DB 특화 쿼리를 타입 안전하게 사용할 수 있게 합니다.
- CamelCasePlugin 덕분에 snake_case 테이블 컬럼을 camelCase API로 다루는 통일성이 생깁니다.

### `onModuleInit()`

동작 순서
1. `this.$connect()`
2. `_extendedClient` 방어적 재초기화
3. Prisma `SELECT 1` ping
4. Kysely `SELECT 1 as val` ping
5. 로그 출력

중요한 관찰
- 이 모듈은 연결만 하는 것이 아니라, 부트 시점에 실제 Prisma/Kysely 테스트 쿼리까지 실행합니다.
- 따라서 초기화 실패가 비교적 빠르게 드러납니다.

### `onModuleDestroy()`
- `$disconnect()` 수행

### `kysely` getter
- base extended client의 `$kysely`를 노출합니다.
- 트랜잭션 공유가 아니라 “기본 클라이언트 기반 Kysely 접근”입니다.

### `extended` getter
- CLS transactional plugin과 일부 유틸이 사용할 확장 전체 클라이언트를 반환합니다.

## 3. `cls.module.spec.ts` / `prisma.module.spec.ts`

역할
- PrismaModule과 ClsModule 연결 여부를 확인하는 테스트입니다.

현재 관찰
- 두 파일의 내용은 사실상 동일합니다.
- 검증 수준은 “모듈이 정의되는지, PrismaService가 주입 가능한지” 정도입니다.
- 실제 `@Transactional()` 경계, `@InjectTransaction()` 주입, `$kysely` 공유, 롤백 동작까지 검증하지는 않습니다.

런타임 흐름 분석

## 1. 부트스트랩 흐름

1. [../../src/app.module.ts](../../src/app.module.ts)가 `PrismaModule` import
2. `PrismaService` 생성자에서 DB adapter와 extended client 준비
3. `onModuleInit()`에서 DB 연결 및 health check 수행
4. `PrismaModule`이 `EXTENDED_PRISMA_CLIENT`를 export
5. `CustomClsModule` transactional plugin이 해당 토큰을 사용

실무 의미
- 이 프로젝트에서 Prisma는 단순 provider가 아니라, 애플리케이션 부팅 성공 조건에 직접 관여합니다.

## 2. 권장 트랜잭션 흐름

대표 예시
- [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
- [../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts](../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts)

흐름
1. 서비스 메서드에 `@Transactional()` 선언
2. 리포지토리는 `@InjectTransaction()`으로 `PrismaTransaction` 주입
3. 리포지토리 내부에서 `tx.model...`, `tx.$kysely`, `tx.$executeRaw` 사용
4. 같은 CLS context 안에서 모든 DB 작업이 묶임

이 패턴이 중요한 이유
- 사용자 요청 하나에 여러 리포지토리 호출이 엮일 때 원자성을 확보할 수 있습니다.
- 서비스는 트랜잭션 경계를 선언하고, 리포지토리는 현재 트랜잭션을 따르는 식으로 역할이 분리됩니다.

## 3. 트랜잭션 안에서 Kysely/raw SQL 쓰는 흐름

대표 예시
- [../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts](../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts)
- [../../src/infrastructure/concurrency/advisory-lock.service.ts](../../src/infrastructure/concurrency/advisory-lock.service.ts)

흐름
- `@InjectTransaction()`으로 받은 `tx`에서 `tx.$kysely`, `tx.$executeRaw`, `tx.$executeRawUnsafe`를 사용합니다.

의미
- 복잡한 upsert/통계 누적/DB 특화 함수 호출이 필요해도, 트랜잭션 경계를 버리지 않고 처리할 수 있습니다.

## 4. 직접 `PrismaService` 사용하는 흐름

대표 예시
- [../../src/modules/reward/core/application/get-user-rewards.service.ts](../../src/modules/reward/core/application/get-user-rewards.service.ts)
- [../../src/modules/exchange/application/exchange-rate.service.ts](../../src/modules/exchange/application/exchange-rate.service.ts)
- [../../src/modules/audit-log/infrastructure/audit-log.adapter.ts](../../src/modules/audit-log/infrastructure/audit-log.adapter.ts)
- [../../src/cli/commands/create-admin.command.ts](../../src/cli/commands/create-admin.command.ts)
- [../../src/infrastructure/concurrency/concurrency.service.ts](../../src/infrastructure/concurrency/concurrency.service.ts)

성격별 분류
- 단순 조회/페이지네이션: 보상 조회 서비스
- 독립 어댑터: Audit Log 저장 어댑터
- CLI/관리 작업: create-admin command
- 프록시 우회 의도: global lock 서비스

의미
- 직접 PrismaService 사용 자체가 금지된 것은 아닙니다.
- 다만 “현재 CLS 트랜잭션 프록시에 묶여야 하는 비즈니스 변경”에서 무심코 쓰면 안 된다는 것이 핵심입니다.

실제 사용 패턴 정리

## 1. 가장 권장되는 패턴: 서비스 `@Transactional()` + 리포지토리 `@InjectTransaction()`

대표 예시
- [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
- [../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts](../../src/modules/chat/rooms/infrastructure/chat-room.repository.ts)
- [../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts](../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts)

특징
- 서비스는 트랜잭션 경계를 선언
- 리포지토리는 현재 트랜잭션을 주입받음
- Prisma delegate와 `$kysely`를 같은 tx 안에서 함께 사용 가능

## 2. 허용되는 직접 `PrismaService` 패턴: 조회 서비스

대표 예시
- [../../src/modules/reward/core/application/get-user-rewards.service.ts](../../src/modules/reward/core/application/get-user-rewards.service.ts)
- [../../src/modules/reward/core/application/get-admin-rewards.service.ts](../../src/modules/reward/core/application/get-admin-rewards.service.ts)
- [../../src/modules/exchange/application/exchange-rate.service.ts](../../src/modules/exchange/application/exchange-rate.service.ts)

특징
- 단순 조회, 카운트, 페이지네이션
- 복잡한 쓰기 원자성이 필요하지 않음
- 리포지토리 계층 없이 직접 Prisma delegate를 쓰는 단순 쿼리 서비스 성격

## 3. 허용되는 직접 `PrismaService` 패턴: 독립 인프라/어댑터

대표 예시
- [../../src/modules/audit-log/infrastructure/audit-log.adapter.ts](../../src/modules/audit-log/infrastructure/audit-log.adapter.ts)

특징
- 도메인 유스케이스 내부 원자성보다 독립 저장/기록 자체가 중요함
- 경우에 따라 상위 비즈니스 트랜잭션과 결합하지 않는 것이 더 자연스러울 수 있음

## 4. 허용되는 직접 `PrismaService` 패턴: 프록시 우회가 중요한 경우

대표 예시
- [../../src/infrastructure/concurrency/concurrency.service.ts](../../src/infrastructure/concurrency/concurrency.service.ts)

특징
- 코드 주석상 “Prisma Proxy를 거치지 않고 직접 쿼리를 실행하여 트랜잭션 전파 차단”이 목적입니다.
- `this.prisma.kysely`를 사용해 글로벌 락을 트랜잭션 밖에서 다룹니다.

실무 의미
- 이 경로는 예외이지만, 매우 중요한 예외입니다.
- 어떤 작업은 오히려 현재 트랜잭션에 묶이지 않아야 의미가 맞습니다.

## 5. 유틸에서 양쪽을 모두 받는 패턴

대표 예시
- [../../src/utils/id.util.ts](../../src/utils/id.util.ts)

특징
- `IdUtil.generateNextWhitecliffId()`는 `PrismaService | Prisma.TransactionClient | ExtendedClient | PrismaTransaction`을 모두 받습니다.
- 즉, 유틸 레벨에서는 “기본 클라이언트와 트랜잭션 클라이언트 모두 지원”하도록 설계된 곳도 있습니다.

중요 관찰 및 주의사항

## 1. 가장 중요한 운영 규칙: 상태 변경 서비스는 가능하면 CLS 프록시 경로를 타야 한다
- 현재 프로젝트의 트랜잭션 모델은 `@Transactional()` + `@InjectTransaction()` 조합을 전제로 합니다.
- 비즈니스 쓰기 흐름에서 `PrismaService`를 직접 쓰면, 같은 요청 안의 다른 리포지토리 작업과 트랜잭션 경계가 어긋날 수 있습니다.

권장 규칙
- 상태 변경 유스케이스: `@Transactional()` + 리포지토리 `@InjectTransaction()`
- 단순 조회/독립 어댑터/CLI/프록시 우회: `PrismaService` 직접 사용 가능

## 2. `PrismaService` 직접 사용은 CLS 트랜잭션 참여를 보장하지 않는다
- transactional plugin은 `EXTENDED_PRISMA_CLIENT` 토큰에 걸려 있습니다.
- 기본 `PrismaService` provider를 직접 주입받는 것은 별도 경로입니다.

[주의]
- `@Transactional()` 메서드 안이라고 해서 `PrismaService` 직접 호출이 자동으로 같은 tx에 들어간다고 가정하면 안 됩니다.

## 3. 트랜잭션 공유 raw SQL이 필요하면 `prisma.kysely`가 아니라 `tx.$kysely`를 써야 한다
- [../../src/infrastructure/concurrency/concurrency.service.ts](../../src/infrastructure/concurrency/concurrency.service.ts)의 `prisma.kysely`는 의도적 우회 사례입니다.
- 반면 트랜잭션 안에서 raw SQL/Kysely가 필요하면 [../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts](../../src/modules/user-analytics/infrastructure/persistence/user-analytics.repository.ts)처럼 `tx.$kysely`를 사용해야 합니다.

## 4. `PrismaService`는 EnvService를 우회해 `DATABASE_URL`을 직접 읽는다
- 생성자에서 `process.env.DATABASE_URL`을 직접 사용합니다.
- 따옴표 제거 로직도 여기 있습니다.

의미
- Prisma 연결 설정은 현재 Env 인프라의 타입화 범위 밖에 있습니다.
- EnvModule을 수정해도 `DATABASE_URL` 처리 규칙은 별도로 봐야 합니다.

## 5. 부트 시점 로그와 health check가 강하다
- `onModuleInit()`에서 Prisma ping과 Kysely ping을 모두 수행합니다.
- 로그도 비교적 많은 편입니다.

의미
- 연결 문제를 빨리 발견할 수 있는 장점이 있습니다.
- 반면 테스트/부트 로그가 장황해질 수 있습니다.

## 6. 테스트는 얕고 중복된다
- [../../src/infrastructure/prisma/cls.module.spec.ts](../../src/infrastructure/prisma/cls.module.spec.ts)
- [../../src/infrastructure/prisma/prisma.module.spec.ts](../../src/infrastructure/prisma/prisma.module.spec.ts)

관찰
- 두 파일이 사실상 같은 내용을 담고 있습니다.
- 실제 롤백/중첩 트랜잭션/`tx.$kysely` 공유까지는 검증하지 않습니다.

## 7. 전역 모듈이지만 feature module에서 반복 import 되고 있다
- `PrismaModule`은 `@Global()`인데도 여러 모듈과 테스트가 직접 import 합니다.

의미
- 기술적으로는 중복일 수 있지만, 테스트/의존성 명시/로컬 가독성을 위해 관례적으로 유지되는 것으로 보입니다.

새 작업 시 체크리스트
1. 이 작업이 상태 변경 유스케이스인지, 단순 조회/CLI/독립 어댑터인지 먼저 구분
2. 상태 변경이면 서비스에 `@Transactional()`을 붙이고, 리포지토리는 `@InjectTransaction()` 경로를 따를지 먼저 결정
3. raw SQL/Kysely가 필요해도 트랜잭션 공유가 필요하면 `tx.$kysely`를 사용
4. `PrismaService`를 직접 쓰는 경우 “왜 tx 프록시를 안 타는지”를 설명할 수 있어야 함
5. 새 유틸이 기본/트랜잭션 클라이언트 양쪽을 받아야 하는지 검토
6. `DATABASE_URL` 관련 수정은 EnvService가 아니라 `PrismaService` 생성자도 함께 확인
7. 테스트를 추가할 때 단순 module availability보다 실제 롤백/전파 동작 검증을 우선 고려

변경 시 특히 조심할 점
- `EXTENDED_PRISMA_CLIENT` 토큰 변경: CLS transactional plugin 전체가 깨짐
- `PrismaTransaction` 타입 변경: 모든 `@InjectTransaction()` 리포지토리에 영향
- `createExtendedClient()` 변경: `$kysely` 기반 인프라 전체에 영향
- `PrismaService` 생성자 변경: 부트 및 DB 연결 실패 조건 변경
- `prisma.kysely`와 `tx.$kysely` 구분 흐림: 트랜잭션 경계 버그로 이어질 수 있음
- 직접 `PrismaService` 사용을 무분별하게 늘리면 CLS 기반 트랜잭션 모델이 약해짐

요약 결론
- 이 Prisma 모듈의 핵심은 `PrismaService` 자체보다도, 그것이 만들어 내는 `EXTENDED_PRISMA_CLIENT`와 CLS transactional plugin 연결입니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - 상태 변경 서비스는 가능하면 `@Transactional()` + `@InjectTransaction()` 경로를 따라야 한다는 점
  - 직접 `PrismaService` 사용은 허용되지만, 그것은 조회/CLI/독립 어댑터/프록시 우회처럼 의도적 예외여야 한다는 점
  - 트랜잭션 공유가 필요한 raw SQL/Kysely는 반드시 `tx.$kysely`를 사용해야 하고, `prisma.kysely`는 의미가 다르다는 점