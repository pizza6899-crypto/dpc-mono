# Env 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/env`

간단 요약
- 목적: `process.env`에 있는 런타임 환경값을 Nest `ConfigModule`로 로드하고, 애플리케이션 전반에서 `EnvService`라는 타입화된 facade로 읽을 수 있게 만드는 공통 인프라입니다.
- 핵심 책임: 설정 그룹별 로딩, 문자열 환경값의 기본 파싱/정규화, 기능 모듈에 대한 `EnvService` 주입 진입점 제공.
- 이 모듈은 “강력한 검증기”라기보다, “Config 로더 + 편의 getter 집합”에 더 가깝습니다.

소스 구성
- [../../src/infrastructure/env/env.config.ts](../../src/infrastructure/env/env.config.ts) — 설정 그룹별 로딩 정의 (`registerAs`)
- [../../src/infrastructure/env/env.module.ts](../../src/infrastructure/env/env.module.ts) — `ConfigModule.forRoot(...)` 조립 및 `EnvService` export
- [../../src/infrastructure/env/env.service.ts](../../src/infrastructure/env/env.service.ts) — 타입화된 getter facade
- [../../src/infrastructure/env/env.types.ts](../../src/infrastructure/env/env.types.ts) — 설정 타입 계약

관련 연동 지점
- [../../src/app.module.ts](../../src/app.module.ts) — `EnvModule` import
- [../../src/main.ts](../../src/main.ts) — 앱 부트스트랩 시 세션/Redis/Swagger/AsyncAPI 구성에 사용
- [../../src/infrastructure/bullmq/bullmq.module.ts](../../src/infrastructure/bullmq/bullmq.module.ts) — BullMQ Redis 연결 구성
- [../../src/infrastructure/redis/redis.service.ts](../../src/infrastructure/redis/redis.service.ts) — Redis 클라이언트 생성
- [../../src/infrastructure/storage/storage.service.ts](../../src/infrastructure/storage/storage.service.ts) — 스토리지 설정 사용
- [../../src/infrastructure/sqids/sqids.service.ts](../../src/infrastructure/sqids/sqids.service.ts) — Sqids alphabet/minLength 사용
- [../../src/common/auth/strategies/google.strategy.ts](../../src/common/auth/strategies/google.strategy.ts) — Google OAuth 설정 사용
- [../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts](../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts) — SMTP 설정 사용
- [../../src/modules/casino/aggregator/application/aggregator-registry.service.ts](../../src/modules/casino/aggregator/application/aggregator-registry.service.ts) — Whitecliff/DCS 통합 설정 사용

대표 사용처
- 앱 부트 설정
  - [../../src/main.ts](../../src/main.ts)
- 세션/인증
  - [../../src/common/auth/strategies/google.strategy.ts](../../src/common/auth/strategies/google.strategy.ts)
  - [../../src/modules/auth/credential/application/login.service.ts](../../src/modules/auth/credential/application/login.service.ts)
- 외부 연동 공급자
  - [../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts](../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts)
  - [../../src/modules/exchange/infrastructure/open-exchange-rates-api.service.ts](../../src/modules/exchange/infrastructure/open-exchange-rates-api.service.ts)
  - [../../src/infrastructure/blockchain/solana/solana.service.ts](../../src/infrastructure/blockchain/solana/solana.service.ts)
- 스토리지/파일 URL
  - [../../src/modules/file/application/create-file.service.ts](../../src/modules/file/application/create-file.service.ts)
  - [../../src/modules/file/application/file-url.service.ts](../../src/modules/file/application/file-url.service.ts)
- 카지노 공급자 다중 설정
  - [../../src/modules/casino/aggregator/application/aggregator-registry.service.ts](../../src/modules/casino/aggregator/application/aggregator-registry.service.ts)
  - [../../src/modules/casino/providers/whitecliff/infrastructure/whitecliff-api.service.ts](../../src/modules/casino/providers/whitecliff/infrastructure/whitecliff-api.service.ts)

한눈에 보는 구조
1. [../../src/infrastructure/env/env.module.ts](../../src/infrastructure/env/env.module.ts)가 `ConfigModule.forRoot({ isGlobal: true, load: [...] })`를 호출합니다.
2. [../../src/infrastructure/env/env.config.ts](../../src/infrastructure/env/env.config.ts)의 각 `registerAs('name', () => value)`가 `process.env`를 읽어 설정 그룹 객체를 만듭니다.
3. `ConfigService`는 이 그룹들을 보관합니다.
4. `EnvService`는 `configService.get('app')`, `configService.get('redis')` 같은 getter를 감싼 typed facade를 제공합니다.
5. 각 기능 모듈은 `EnvModule`을 import하고 `EnvService`를 주입받아 설정을 읽습니다.

아키텍처 핵심 포인트

## 1. `ConfigModule`은 전역, `EnvService`는 전역이 아니다
- `ConfigModule.forRoot({ isGlobal: true })` 덕분에 `ConfigService`는 전역입니다.
- 하지만 `EnvModule` 자체에는 `@Global()`이 없습니다.
- 따라서 `EnvService`를 쓰는 기능 모듈은 보통 `EnvModule`을 직접 import해야 합니다.

실무 의미
- “환경 설정 시스템”은 전역이지만, “타입화된 진입점”인 `EnvService`는 모듈별 의존성으로 관리됩니다.

## 2. 이 모듈은 validation schema를 두지 않는다
- `ConfigModule.forRoot(...)`에 `validationSchema`나 `validate`가 없습니다.
- 대부분의 값은 단순히 `process.env`에서 읽고 기본값을 주거나 그대로 반환합니다.

실무 의미
- 부팅 시점에 필수 환경값 누락을 체계적으로 잡아주지 않습니다.
- 실제 실패는 해당 값을 사용하는 런타임 지점에서 더 늦게 드러날 수 있습니다.

## 3. 타입 안전성은 주로 TypeScript 착시다
- [../../src/infrastructure/env/env.types.ts](../../src/infrastructure/env/env.types.ts)는 많은 필드를 `string` 또는 필수 속성으로 선언합니다.
- 하지만 [../../src/infrastructure/env/env.config.ts](../../src/infrastructure/env/env.config.ts)는 `process.env.SOME_KEY`를 그대로 넣는 경우가 많아서 실제 런타임 값은 `undefined`일 수 있습니다.
- `EnvService`는 `configService.get<T>(...)!` 비단언(`!`)을 사용합니다.

의미
- 컴파일 타임에는 안전해 보여도, 런타임에서는 필수값 누락이 조용히 통과할 수 있습니다.

## 4. 설정은 그룹 단위로 조직되어 있다
- `app`, `jwt`, `redis`, `googleOAuth`, `whitecliff`, `dcs`, `scheduler`, `nowPayment`, `session`, `adminSession`, `csrf`, `smtp`, `coingecko`, `openExchangeRates`, `deposit`, `wallet`, `sqids`, `storage`, `cloudflareAi`, `solana`

의미
- 대부분의 소비 코드는 “원시 환경 변수명” 대신 도메인 의미가 있는 config group으로 접근합니다.
- 예: `envService.redis.port`, `envService.smtp.enabled`, `envService.whitecliff`

## 5. 일부 환경값은 다중 인스턴스 패턴을 가진다
- Whitecliff 설정은 `WHITECLIFF_1_*`, `WHITECLIFF_2_*` 식의 인덱스 기반 시퀀스를 읽습니다.
- 즉, 이 모듈은 단일 설정뿐 아니라 “배열형 provider config”도 지원합니다.

파일별 상세 분석

## 1. `env.config.ts`

역할
- 실제 `process.env`를 읽어 설정 그룹 객체를 만드는 핵심 정의 파일입니다.

설정 그룹 목록
- `appConfig`
- `jwtConfig`
- `redisConfig`
- `googleOAuthConfig`
- `whitecliffConfig`
- `dcsConfig`
- `schedulerConfig`
- `nowPaymentConfig`
- `sessionConfig`
- `adminSessionConfig`
- `csrfConfig`
- `smtpConfig`
- `coingeckoConfig`
- `openExchangeRatesConfig`
- `depositConfig`
- `walletConfig`
- `sqidsConfig`
- `storageConfig`
- `cloudflareAiConfig`
- `solanaConfig`

### 기본 파싱 패턴

숫자
- `parseInt(process.env.PORT ?? '3000', 10)`
- `parseInt(process.env.REDIS_PORT ?? '6379', 10)`

불리언
- 다수는 `process.env.KEY === 'true'`
- 일부 scheduler/httpOnly 계열은 `.toLowerCase().trim()`을 사용

배열
- `CORS_ORIGIN`, `*_ALLOWED_CURRENCIES`는 `split(',')`로 파싱
- 통화 배열은 `trim().toUpperCase()`까지 수행

중요한 관찰
- 불리언 파싱 규칙이 일관적이지 않습니다.
- 예를 들어 `SESSION_SECURE`는 정확히 `'true'`일 때만 true지만, scheduler 일부는 대소문자/공백을 허용합니다.

### `whitecliffConfig`

특징
- 인덱스 기반 루프를 돌며 `WHITECLIFF_1_AGENT_CODE`, `WHITECLIFF_2_AGENT_CODE` 식으로 읽습니다.
- 설정이 하나도 없으면 즉시 `throw new Error('At least one Whitecliff configuration is required')`

의미
- Whitecliff를 사용하지 않는 환경에서도 이 설정이 없으면 앱이 부팅되지 않을 수 있습니다.
- 현재 구조상 이는 “선택적 공급자 설정”이 아니라 사실상 필수 부트 조건입니다.

### `appConfig`

포함 값
- `port`, `nodeEnv`, `apiPrefix`, `corsOrigin`, `staticAssetsBaseUrl`, `backendUrl`, `frontendUrl`, `cdnUrl`

관찰
- `backendUrl`, `frontendUrl`, `cdnUrl`는 타입상 필수에 가깝지만 별도 기본값/검증이 없습니다.

### `redisConfig`

현재 실제 로딩 값
- `host`
- `port`

중요한 관찰
- 타입 파일의 `RedisConfig`에는 `password?`, `db`가 존재하지만, 실제 `redisConfig` 로더는 이를 채우지 않습니다.

### `sessionConfig` / `adminSessionConfig`

역할
- 일반 사용자 세션과 관리자 세션을 분리된 비밀키/쿠키 정책으로 제어합니다.

기본값 차이
- 일반 세션 기본 TTL: 7일
- 관리자 세션 기본 TTL: 1시간
- 일반 sameSite 기본: `lax`
- 관리자 sameSite 기본: `strict`

### `depositConfig` / `walletConfig`

역할
- 허용 통화 목록을 환경변수 기반으로 제어합니다.

의미
- 통화 허용 정책 일부는 정적 enum이 아니라 환경값으로 바뀝니다.

## 2. `env.module.ts`

역할
- ConfigModule과 EnvService를 하나의 인프라 모듈로 묶습니다.

핵심 구성
- `ConfigModule.forRoot({ isGlobal: true, load: [...] })`
- provider: `EnvService`
- export: `EnvService`, `ConfigModule`

중요한 관찰
- `.env` 파일 경로 커스터마이징, validation, variable expansion, 캐시 옵션은 보이지 않습니다.
- Nest Config의 기본 동작에 상당 부분 의존합니다.

## 3. `env.service.ts`

역할
- `ConfigService`를 프로젝트용 typed facade로 감싼 서비스입니다.

구성 방식
- 그룹별 getter 제공
  - `app`, `jwt`, `redis`, `googleOAuth`, `whitecliff`, `dcs`, `scheduler`, `nowPayment`, `session`, `adminSession`, `csrf`, `smtp`, `coingecko`, `openExchangeRates`, `deposit`, `wallet`, `sqids`, `storage`, `cloudflareAi`, `solana`
- 보조 getter 제공
  - `nodeEnv`
  - `pm2InstanceNumber`
  - `all`

### `nodeEnv`
- 특이하게 `configService.get('NODE_ENV', 'development')`로 직접 읽습니다.
- 반면 `app.nodeEnv`는 `app` 그룹 내부 값입니다.

의미
- `envService.nodeEnv`와 `envService.app.nodeEnv`라는 두 접근 경로가 공존합니다.
- 현재 둘 다 같은 원천(`process.env.NODE_ENV`)을 보지만, API가 중복되어 있습니다.

### `all`
- 모든 그룹을 한 번에 조립한 convenience getter입니다.

현재 검색 기준 관찰
- `envService.all` 사용처는 보이지 않습니다.
- 디버깅/관리용 편의 API 성격이 강합니다.

## 4. `env.types.ts`

역할
- 설정 객체들의 TypeScript 인터페이스를 정의합니다.

주요 타입군
- 앱/인증/세션: `AppConfig`, `JwtConfig`, `SessionConfig`, `AdminSessionConfig`, `CsrfConfig`, `GoogleOAuthConfig`
- 인프라: `RedisConfig`, `StorageConfig`, `SqidsConfig`, `SolanaConfig`
- 외부 공급자: `WhitecliffConfig`, `DcsConfig`, `NowPaymentConfig`, `SmtpConfig`, `CoingeckoConfig`, `OpenExchangeRatesConfig`, `CloudflareAiConfig`
- 도메인 정책: `DepositConfig`, `WalletConfig`, `SchedulerConfig`
- 집계형: `EnvironmentConfig`

중요한 관찰
- 실제 로딩 값과 타입 선언이 완전히 일치하지 않는 항목이 있습니다.
- 대표적으로 `RedisConfig`는 `password`, `db`를 포함하지만 실제 로더는 채우지 않습니다.

런타임 흐름 분석

## 1. 부트스트랩 흐름

핵심 위치
- [../../src/app.module.ts](../../src/app.module.ts)
- [../../src/main.ts](../../src/main.ts)

흐름
1. AppModule이 `EnvModule`을 import
2. `ConfigModule.forRoot(...)`가 환경값을 읽어 그룹별 config를 생성
3. `main.ts`에서 `app.get(EnvService)`로 서비스 획득
4. 세션 미들웨어, Redis client, Swagger, AsyncAPI, listen port 등을 구성

대표 사용
- `envService.redis.host`, `envService.redis.port`
- `envService.session.*`
- `envService.adminSession.*`
- `envService.app.port`

실무 의미
- `main.ts`는 이 모듈이 실제로 시스템 전반을 어떻게 조립하는지 보여 주는 가장 중요한 사용처입니다.

## 2. 기능 모듈 주입 흐름

대표 예시
- [../../src/infrastructure/bullmq/bullmq.module.ts](../../src/infrastructure/bullmq/bullmq.module.ts)
- [../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts](../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts)
- [../../src/common/auth/strategies/google.strategy.ts](../../src/common/auth/strategies/google.strategy.ts)

흐름
1. 기능 모듈이 `EnvModule` import
2. provider/service가 `EnvService` 주입
3. 필요한 group getter만 읽음

의미
- 설정 소비가 `process.env` 문자열을 직접 파싱하는 대신, 도메인 의미를 가진 객체 접근으로 통일됩니다.

## 3. 다중 공급자 배열 설정 흐름

대표 예시
- [../../src/modules/casino/aggregator/application/aggregator-registry.service.ts](../../src/modules/casino/aggregator/application/aggregator-registry.service.ts)

흐름
1. `envService.whitecliff`가 배열 반환
2. 애그리게이터 서비스가 각 env config를 도메인 통합 객체로 변환
3. 내부 통화 코드 기준으로 알맞은 공급자 설정 선택

의미
- 단순 key-value 환경 로딩을 넘어, 하나의 provider family를 여러 엔트리로 구성하는 구조를 지원합니다.

## 4. CLI/부트 전 환경 변경 흐름

대표 예시
- [../../src/cli/cli.ts](../../src/cli/cli.ts)

관찰
- CLI는 부트 전에 `process.env.NODE_ENV = 'cli'` 같은 값을 직접 세팅합니다.

의미
- 이 모듈은 결국 부트 시점의 `process.env` 스냅샷 위에 있으므로, 부트 이전 환경 수정은 그대로 반영됩니다.

실제 사용 패턴 정리

## 1. 부트/인프라 조립 패턴

대표 예시
- [../../src/main.ts](../../src/main.ts)
- [../../src/infrastructure/bullmq/bullmq.module.ts](../../src/infrastructure/bullmq/bullmq.module.ts)

특징
- Redis, 세션, 포트, Swagger 같은 시스템 조립값을 읽습니다.
- 이 레벨에서는 `EnvService`가 사실상 시스템 wiring 입력값 역할을 합니다.

## 2. 외부 API 공급자 설정 패턴

대표 예시
- [../../src/common/auth/strategies/google.strategy.ts](../../src/common/auth/strategies/google.strategy.ts)
- [../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts](../../src/modules/notification/infrastructure/channels/email/providers/nodemailer.adapter.ts)
- [../../src/modules/exchange/infrastructure/open-exchange-rates-api.service.ts](../../src/modules/exchange/infrastructure/open-exchange-rates-api.service.ts)

특징
- provider constructor에서 설정을 읽고 클라이언트/strategy/transporter를 초기화합니다.
- 설정이 누락되어도 반드시 부트에서 바로 막히지는 않고, provider 내부에서 경고/런타임 오류로 드러나는 경우가 많습니다.

## 3. 도메인 정책/기능 토글 패턴

대표 예시
- `scheduler.enabled`
- `deposit.cryptoDepositEnabled`
- `smtp.enabled`
- `cloudflareAi.enabled`

특징
- “값 그 자체”뿐 아니라 기능 on/off 플래그로 자주 사용됩니다.

## 4. URL/스토리지 기반 파생값 패턴

대표 예시
- [../../src/modules/file/application/file-url.service.ts](../../src/modules/file/application/file-url.service.ts)
- [../../src/modules/casino/aggregator/application/provider/update-game-provider.service.ts](../../src/modules/casino/aggregator/application/provider/update-game-provider.service.ts)

특징
- `cdnUrl`, bucket, endpoint 같은 값이 실제 사용자 노출 URL 형성에 직접 쓰입니다.

중요 관찰 및 주의사항

## 1. 중앙 진입점이 있지만 완전한 단일 진실 공급원은 아니다
- 많은 코드가 `EnvService`를 사용하지만, 일부는 여전히 `process.env`를 직접 읽습니다.

대표 예시
- [../../src/common/security/cors.config.ts](../../src/common/security/cors.config.ts)
- [../../src/common/http/exception/http-exception.filter.ts](../../src/common/http/exception/http-exception.filter.ts)
- [../../src/utils/currency.util.ts](../../src/utils/currency.util.ts)

의미
- 환경 설정 접근이 완전히 중앙화되어 있지 않습니다.
- `EnvService.app.corsOrigin`과 `cors.config.ts`의 직접 파싱이 중복될 수 있습니다.

## 2. 타입과 실제 로딩 값이 어긋나는 항목이 있다

대표 예시
- [../../src/infrastructure/env/env.types.ts](../../src/infrastructure/env/env.types.ts)의 `RedisConfig`
- [../../src/infrastructure/env/env.config.ts](../../src/infrastructure/env/env.config.ts)의 `redisConfig`

관찰
- 타입은 `password?`, `db`를 포함하지만 실제 로더는 `host`, `port`만 채웁니다.
- 그런데 [../../src/infrastructure/bullmq/bullmq.module.ts](../../src/infrastructure/bullmq/bullmq.module.ts)는 `envService.redis.password`를 사용하려고 합니다.

[주의]
- 현재 코드 기준 Redis 비밀번호는 타입상 존재하지만 실제 config group에는 들어오지 않을 가능성이 큽니다.

## 3. 필수값 누락이 조용히 통과할 수 있다
- 예를 들어 `smtp.host`, `googleOAuth.clientId`, `storage.bucket`, `sqids.alphabet`은 타입상 필수처럼 보입니다.
- 하지만 로더는 별도 검증 없이 `undefined`를 허용하는 형태입니다.

실무 의미
- 초기화 시점 또는 실제 API 호출 시점에야 실패가 드러날 수 있습니다.

## 4. Whitecliff는 사실상 필수 부트 의존성처럼 동작한다
- 설정이 없으면 `whitecliffConfig`가 throw 합니다.
- 따라서 Whitecliff 기능을 당장 사용하지 않더라도 환경이 준비되지 않으면 앱이 올라오지 않을 수 있습니다.

## 5. boolean 파싱 규칙이 일관적이지 않다
- 일부는 `=== 'true'`
- 일부는 `.toLowerCase().trim() === 'true'`
- 일부는 `!== 'false'`로 기본 true를 구현

의미
- 같은 성격의 플래그라도 공백/대소문자 허용 범위가 다릅니다.
- 운영자가 환경값을 입력할 때 실수 여지가 있습니다.

## 6. `envService.nodeEnv`와 `envService.app.nodeEnv`가 공존한다
- 둘 다 현재는 같은 원천값을 보지만, API 관점에서는 중복입니다.

대표 예시
- [../../src/main.ts](../../src/main.ts)에서 두 방식이 모두 사용됩니다.

## 7. 전용 Env 모듈 테스트는 보이지 않는다
- 현재 검색 기준 `env` 전용 spec/integration 테스트 파일은 보이지 않습니다.
- 일부 다른 테스트는 mock된 `envService.scheduler` 값을 바꿔 사용하는 정도입니다.

## 8. `envService.all`은 현재 미사용으로 보인다
- 검색 기준 직접 사용처가 없습니다.
- 편의 getter이지만 실질적인 시스템 계약으로 쓰이지는 않는 상태입니다.

새 작업 시 체크리스트
1. 새 설정이 정말 환경변수여야 하는지, DB 설정/도메인 설정이어야 하는지 먼저 구분
2. 환경변수라면 `env.config.ts`, `env.types.ts`, `env.service.ts`를 함께 갱신
3. 값이 필수라면 현재 구조로 충분한지, 검증 로직이 필요한지 판단
4. 불리언/배열/숫자 파싱 규칙을 기존 패턴과 일관되게 맞출지 검토
5. 여러 엔트리를 지원해야 하면 Whitecliff처럼 배열 패턴이 필요한지 확인
6. 새 소비 코드에서는 가능하면 `process.env` 직접 접근 대신 `EnvService`를 우선 사용
7. 기존 group과 중복되는 값인지, 이미 다른 파일에서 직접 파싱 중인지 점검

변경 시 특히 조심할 점
- `registerAs` 키 이름 변경: 모든 `configService.get()` / `EnvService` getter 계약이 깨짐
- 필드명 변경: 소비자 전역에 영향
- Whitecliff 로딩 규칙 변경: 부트 성공 조건이 달라짐
- 세션/Redis 관련 값 변경: 인증/워크큐/웹소켓까지 연쇄 영향
- `NODE_ENV` 접근 규칙 변경: 문서 노출, 예외 메시지, 디버그 동작에 영향
- 직접 `process.env`를 읽는 우회 경로를 놓치지 않도록 주의

요약 결론
- 이 Env 모듈은 설정을 중앙으로 모으는 데는 성공했지만, “엄격한 검증 계층”까지 담당하지는 않습니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - 실제 본체는 [../../src/infrastructure/env/env.config.ts](../../src/infrastructure/env/env.config.ts)의 그룹별 로더와 [../../src/infrastructure/env/env.service.ts](../../src/infrastructure/env/env.service.ts)의 facade 조합이라는 점
  - 현재 구조는 타입화된 접근을 제공하지만, 필수값 검증과 타입 일치 보장은 약하다는 점
  - 일부 직접 `process.env` 접근과 일부 타입/로딩 불일치가 남아 있어, 완전한 단일 진실 공급원으로 보기는 어렵다는 점