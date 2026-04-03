# Throttle 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/throttle`

간단 요약
- 목적: Redis 기반 카운터를 이용해 HTTP 요청, WebSocket 핸드셰이크, 외부 RPC 호출 등 다양한 경로의 요청 빈도를 제한하는 공통 인프라입니다.
- 핵심 책임: `@Throttle(...)` 데코레이터가 붙은 HTTP 엔드포인트 보호, 서비스 계층에서의 직접 쓰로틀 체크/증가, 공통 키 생성 규칙 제공.
- 이 모듈은 단순 “Nest Guard” 하나가 아니라, `ThrottleGuard`와 `ThrottleService`를 분리해 HTTP 레이어와 비HTTP 레이어 모두에서 재사용할 수 있게 만든 구조입니다.

소스 구성
- [../../src/infrastructure/throttle/throttle.module.ts](../../src/infrastructure/throttle/throttle.module.ts) — Redis 의존성 연결 및 provider/export 등록
- [../../src/infrastructure/throttle/throttle.service.ts](../../src/infrastructure/throttle/throttle.service.ts) — Redis 카운터 기반 쓰로틀 핵심 로직
- [../../src/infrastructure/throttle/throttle.guard.ts](../../src/infrastructure/throttle/throttle.guard.ts) — HTTP 엔드포인트용 가드
- [../../src/infrastructure/throttle/types/throttle.types.ts](../../src/infrastructure/throttle/types/throttle.types.ts) — 옵션/스코프/결과 타입 계약
- [../../src/common/throttle/decorators/throttle.decorator.ts](../../src/common/throttle/decorators/throttle.decorator.ts) — 쓰로틀 메타데이터 데코레이터

관련 연동 지점
- [../../src/app.module.ts](../../src/app.module.ts) — `APP_GUARD`로 `ThrottleGuard`를 전역 등록
- [../../src/infrastructure/redis/redis.service.ts](../../src/infrastructure/redis/redis.service.ts) — `INCR`, `TTL`, `DEL`, `KEYS` 기반 저장소 제공
- [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts) — WebSocket 핸드셰이크 쓰로틀링
- [../../src/modules/user/account/guards/registration-limit.guard.ts](../../src/modules/user/account/guards/registration-limit.guard.ts) — 성공 기반 일일 가입 제한 pre-check
- [../../src/modules/user/account/application/register-user.service.ts](../../src/modules/user/account/application/register-user.service.ts) — 회원가입 성공 후 카운트 증가
- [../../src/infrastructure/blockchain/solana/solana.service.ts](../../src/infrastructure/blockchain/solana/solana.service.ts) — 외부 RPC 호출 속도 제어

대표 사용처
- HTTP 엔드포인트 데코레이터형 제한
  - [../../src/modules/auth/credential/controllers/user/user-auth.controller.ts](../../src/modules/auth/credential/controllers/user/user-auth.controller.ts)
  - [../../src/modules/auth/password/controllers/user-password.controller.ts](../../src/modules/auth/password/controllers/user-password.controller.ts)
  - [../../src/modules/auth/phone-verification/controllers/user/phone-verification.controller.ts](../../src/modules/auth/phone-verification/controllers/user/phone-verification.controller.ts)
  - [../../src/modules/exchange/controllers/admin-exchange.controller.ts](../../src/modules/exchange/controllers/admin-exchange.controller.ts)
  - [../../src/modules/casino/game-catalog/controllers/user/game-user.controller.ts](../../src/modules/casino/game-catalog/controllers/user/game-user.controller.ts)
- 서비스 직접 호출형 제한
  - [../../src/modules/user/account/application/register-user.service.ts](../../src/modules/user/account/application/register-user.service.ts)
  - [../../src/modules/user/account/guards/registration-limit.guard.ts](../../src/modules/user/account/guards/registration-limit.guard.ts)
  - [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts)
  - [../../src/infrastructure/blockchain/solana/solana.service.ts](../../src/infrastructure/blockchain/solana/solana.service.ts)

한눈에 보는 구조
1. [../../src/app.module.ts](../../src/app.module.ts)가 `ThrottleGuard`를 전역 `APP_GUARD`로 등록합니다.
2. 각 컨트롤러/메서드는 `@Throttle({ limit, ttl, scope })`로 메타데이터를 선언합니다.
3. Guard는 메타데이터가 있는 요청에만 동작하고, `ThrottleService`를 통해 Redis 카운터를 증가시킵니다.
4. `ThrottleService`는 Redis 키를 `throttle:` prefix 아래에 저장하고, 허용 여부와 남은 횟수를 계산합니다.
5. HTTP 외 경로는 Guard를 거치지 않고 `ThrottleService.checkAndIncrement()` 또는 `checkLimit()`를 직접 호출합니다.
6. 쓰로틀 상태는 `limit`, `remaining`, `resetTime`, `retryAfter` 형태로 일관되게 반환됩니다.

아키텍처 핵심 포인트

## 1. 전역 Guard지만 실제 적용은 opt-in
- `ThrottleGuard`는 전역 가드로 등록되어 있습니다.
- 하지만 [../../src/common/throttle/decorators/throttle.decorator.ts](../../src/common/throttle/decorators/throttle.decorator.ts)의 메타데이터가 없는 엔드포인트는 그대로 통과합니다.
- 즉, “전역 활성화 + 선택적 적용” 구조입니다.

실무 의미
- 새 엔드포인트는 자동으로 제한되지 않습니다.
- 실제 보호 여부는 `@Throttle(...)`를 붙였는지에 달려 있습니다.

## 2. HTTP와 비HTTP 경로를 같은 서비스가 공유한다
- HTTP 엔드포인트는 Guard를 통해 간접 사용합니다.
- WebSocket 핸드셰이크, 회원가입 일일 제한, Solana RPC 호출은 `ThrottleService`를 직접 호출합니다.

실무 의미
- 이 모듈은 단순 API rate limit 도구가 아니라, “Redis 카운터 기반 request budgeting infrastructure”에 가깝습니다.

## 3. 키 스코프는 endpoint별로 분리된다
- 기본 키에는 `method`와 `path`가 포함됩니다.
- 따라서 같은 IP 또는 같은 사용자라도 다른 엔드포인트면 별도 버킷을 사용합니다.

예시
- `ip:1.2.3.4:post:/auth/login`
- `ip:1.2.3.4:get:/auth/status`

## 4. 성공한 작업만 카운트해야 하는 경우를 따로 지원한다
- 회원가입처럼 “시도 횟수”가 아니라 “성공 횟수”를 제한해야 하는 경우, `checkLimit()`로 사전 검사하고 성공 후 `checkAndIncrement()`를 호출하는 패턴을 사용합니다.

## 5. Redis 장애 시 fail-open 정책을 사용한다
- `checkAndIncrement()`와 `checkLimit()`는 Redis 오류가 나면 요청을 막지 않고 허용합니다.
- 즉, 보호보다 가용성을 우선하는 설계입니다.

파일별 상세 분석

## 1. `throttle.module.ts`

역할
- 쓰로틀 인프라를 묶는 Nest 모듈입니다.

핵심 구성
- `imports: [RedisModule]`
- `providers: [ThrottleService, ThrottleGuard]`
- `exports: [ThrottleService, ThrottleGuard]`

의미
- Redis 없이 이 모듈은 동작할 수 없습니다.
- 다른 모듈은 `ThrottleModule`만 import하면 Guard와 Service를 둘 다 사용할 수 있습니다.

## 2. `throttle.service.ts`

역할
- Redis 카운터 기반 쓰로틀링 계산의 핵심 구현입니다.

내부 상태
- `keyPrefix = 'throttle:'`
- 모든 사용자 제공 키 앞에 prefix를 붙여 Redis 키 공간을 분리합니다.

### `checkAndIncrement(key, options)`

목적
- 요청을 실제로 소비하면서 허용 여부를 판단합니다.

동작 순서
1. `fullKey = throttle:${key}` 생성
2. `INCR`로 카운터 증가
3. `TTL` 조회
4. TTL이 `-1`이면 `EXPIRE options.ttl` 설정
5. `allowed = count <= options.limit` 계산
6. `remaining`, `resetTime`, `retryAfter` 계산 후 반환

중요한 계산 규칙
- `allowed = count <= limit`
- 즉, `limit = 10`이면 10번째 요청까지 허용되고 11번째부터 차단됩니다.
- `remaining = max(0, limit - count)`이므로 첫 요청 직후 남은 횟수는 `limit - 1`입니다.

`resetTime` 의미
- Unix timestamp(초)
- 현재 UTC 시각에 남은 TTL을 더해 계산합니다.

실패 처리
- Redis 오류가 나면 로그를 남기고 `allowed: true`로 반환합니다.

의미
- 시스템 전체 장애를 막기 위해 fail-open을 선택한 것입니다.
- 보안적으로는 덜 엄격하지만, Redis 일시 장애가 API 전체 429/500으로 번지는 것을 막습니다.

### `checkLimit(key, options)`

목적
- 카운터를 증가시키지 않고 “현재 기준으로 다음 요청이 허용될지”만 봅니다.

동작 방식
- `getCurrentCount(key)`와 `getTtl(key)`를 읽습니다.
- `allowed = count < options.limit`로 계산합니다.

왜 `<` 인가
- 이 메서드는 현재 요청을 아직 소비하지 않은 상태의 pre-check이기 때문입니다.
- 다음 단계에서 실제로 `checkAndIncrement()`를 호출하면 그 증가분이 반영됩니다.

대표 사용처
- [../../src/modules/user/account/guards/registration-limit.guard.ts](../../src/modules/user/account/guards/registration-limit.guard.ts)
- [../../src/modules/user/account/application/register-user.service.ts](../../src/modules/user/account/application/register-user.service.ts)

### `generateKey(request, scope, customKeyGenerator?)`

지원 스코프
- `ThrottleScope.IP`
- `ThrottleScope.USER`
- `ThrottleScope.GLOBAL`
- `ThrottleScope.CUSTOM`

규칙
- `CUSTOM`이면 `customKeyGenerator(request)` 우선 사용
- 없으면 기본적으로 IP key로 fallback

### `getIpKey(request)`
- 우선순위:
  - `request.ip`
  - `x-forwarded-for` 첫 번째 값
  - `request.socket.remoteAddress`
  - `'unknown'`
- 여기에 `method`와 `path`를 붙입니다.

### `getUserKey(request)`
- `(request.user as any)?.id || 'anonymous'`
- 즉 인증 유저가 없으면 `anonymous`로 묶입니다.

### `getGlobalKey(request)`
- 경로/메서드 단위의 전역 버킷입니다.

### 보조 메서드
- `getCurrentCount(key)` — 현재 카운트 조회
- `getTtl(key)` — TTL 조회
- `resetKey(key)` — 단일 키 삭제
- `resetKeysByPattern(pattern)` — 패턴 일괄 삭제

운영상 의미
- `reset*` 계열은 관리성 도구에 가깝습니다.
- 다만 `resetKeysByPattern()`은 Redis `KEYS` 명령을 사용하므로 큰 키스페이스에서는 비싼 작업일 수 있습니다.

## 3. `throttle.guard.ts`

역할
- HTTP 요청에 대해 `@Throttle` 메타데이터를 읽고 쓰로틀을 적용합니다.

### 메타데이터 조회
- `Reflector.getAllAndOverride(THROTTLE_KEY, [handler, class])`
- 메서드와 클래스 둘 다 조회하므로, 구조상 클래스 레벨 기본값 + 메서드 오버라이드가 가능합니다.

### 동작 흐름
1. HTTP request 추출
2. `@Throttle` 메타데이터 조회
3. 없으면 통과
4. keyGenerator가 있으면 그 키 사용, 없으면 `generateKey()` 호출
5. `checkAndIncrement()` 호출
6. 제한 초과면 `ApiException(MessageCode.THROTTLE_TOO_MANY_REQUESTS, 429, ...)` 발생
7. 허용 시 응답 헤더 설정 후 통과

응답 헤더
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- 필요 시 `Retry-After`

실무 의미
- Guard 경유 HTTP 요청만 rate-limit 헤더를 받습니다.
- 서비스 직접 호출형 쓰로틀은 이런 헤더를 자동으로 내려주지 않습니다.

중요한 관찰
- 이 Guard는 `switchToHttp()`를 전제로 합니다.
- 따라서 현재 구현은 HTTP 컨텍스트 전용입니다.

## 4. `throttle.types.ts`

역할
- 쓰로틀 옵션과 결과 형식을 고정합니다.

`ThrottleOptions`
- `limit`: 허용 최대 횟수
- `ttl`: 윈도우 길이(초)
- `scope?`: 키 생성 범위
- `keyGenerator?`: 커스텀 키 함수

`ThrottleScope`
- `IP`
- `USER`
- `GLOBAL`
- `CUSTOM`

`ThrottleResult`
- `allowed`
- `limit`
- `remaining`
- `resetTime`
- `retryAfter?`

## 5. `throttle.decorator.ts`

역할
- `THROTTLE_KEY = 'throttle'` 메타데이터 키에 옵션을 저장하는 얇은 래퍼입니다.

의미
- 이 파일 자체는 단순하지만, 현재 쓰로틀 시스템의 선언적 사용성을 만드는 진입점입니다.

런타임 흐름 분석

## 1. HTTP 데코레이터 기반 흐름

핵심 연결
- [../../src/app.module.ts](../../src/app.module.ts)가 `ThrottleGuard`를 전역 가드로 등록

실행 순서
1. 요청 진입
2. `ThrottleGuard` 실행
3. 현재 핸들러/컨트롤러에 `@Throttle(...)`가 있는지 확인
4. scope 또는 custom generator로 Redis 키 생성
5. `checkAndIncrement()` 호출
6. 허용되면 헤더 설정 후 컨트롤러 진입
7. 초과되면 429 `ApiException` 발생

대표 예시
- [../../src/modules/auth/credential/controllers/user/user-auth.controller.ts](../../src/modules/auth/credential/controllers/user/user-auth.controller.ts)
  - 로그인/로그아웃/상태 조회를 IP 기준으로 분당 제한
- [../../src/modules/auth/phone-verification/controllers/user/phone-verification.controller.ts](../../src/modules/auth/phone-verification/controllers/user/phone-verification.controller.ts)
  - 인증번호 발송은 IP 기준, 인증코드 검증은 USER 기준으로 분리
- [../../src/modules/exchange/controllers/admin-exchange.controller.ts](../../src/modules/exchange/controllers/admin-exchange.controller.ts)
  - 관리자 캐시 삭제는 USER 기준 제한

## 2. 성공 기반 제한 흐름

대표 예시
- [../../src/modules/user/account/guards/registration-limit.guard.ts](../../src/modules/user/account/guards/registration-limit.guard.ts)
- [../../src/modules/user/account/application/register-user.service.ts](../../src/modules/user/account/application/register-user.service.ts)

흐름
1. `RegistrationLimitGuard`가 `checkLimit()`로 오늘 가입 허용 여부만 pre-check
2. 실제 회원가입 로직 수행
3. 가입 성공 시 `register-user.service`가 `checkAndIncrement()`로 카운트 증가

설계 의도
- 실패한 가입 시도는 일일 가입 완료 횟수에 포함하지 않으려는 패턴입니다.

## 3. WebSocket 핸드셰이크 제한 흐름

대표 예시
- [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts)

흐름
1. key = `socket_handshake:${ip}`
2. `limit: 120`, `ttl: 10`
3. 허용되지 않으면 연결 자체를 거부

의미
- Guard 없이도 같은 `ThrottleService`를 재사용해 WebSocket 연결 폭주를 제어합니다.

## 4. 외부 RPC 제한 흐름

대표 예시
- [../../src/infrastructure/blockchain/solana/solana.service.ts](../../src/infrastructure/blockchain/solana/solana.service.ts)

흐름
1. key = `solana-rpc`
2. `limit: 10`, `ttl: 1`
3. 초과 시 `retryAfter`만큼 대기 후 1회 재시도
4. 재시도도 실패하면 오류 발생

의미
- 이 모듈은 단순 사용자 rate limit뿐 아니라, 외부 서비스 quota 보호에도 사용됩니다.

실제 사용 패턴 정리

## 1. `@Throttle(...)` 데코레이터 패턴

대표 예시
- [../../src/modules/user/account/controllers/user/account.controller.ts](../../src/modules/user/account/controllers/user/account.controller.ts)
- [../../src/modules/auth/credential/controllers/user/user-auth.controller.ts](../../src/modules/auth/credential/controllers/user/user-auth.controller.ts)
- [../../src/modules/auth/password/controllers/user-password.controller.ts](../../src/modules/auth/password/controllers/user-password.controller.ts)
- [../../src/modules/auth/phone-verification/controllers/user/phone-verification.controller.ts](../../src/modules/auth/phone-verification/controllers/user/phone-verification.controller.ts)

특징
- 선언이 간단함
- 429 응답과 rate-limit 헤더가 자동 처리됨
- 현재 요청 자체가 quota를 즉시 소비함

## 2. `checkLimit()` + 성공 후 `checkAndIncrement()` 패턴

대표 예시
- [../../src/modules/user/account/guards/registration-limit.guard.ts](../../src/modules/user/account/guards/registration-limit.guard.ts)
- [../../src/modules/user/account/application/register-user.service.ts](../../src/modules/user/account/application/register-user.service.ts)

특징
- 성공한 작업만 quota를 소비
- 비즈니스 정책과 더 잘 맞는 경우가 있음
- 대신 pre-check와 increment가 분리되어 있어 엄격한 원자성은 약함

## 3. 비HTTP 직접 호출 패턴

대표 예시
- [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts)
- [../../src/infrastructure/blockchain/solana/solana.service.ts](../../src/infrastructure/blockchain/solana/solana.service.ts)

특징
- Guard나 데코레이터 없이 서비스 직접 호출
- 재시도, 연결 차단, 백그라운드 보호처럼 HTTP 응답과 무관한 시나리오에 적합

중요 관찰 및 주의사항

## 1. Redis 장애 시 쓰로틀이 사실상 꺼진다
- `checkAndIncrement()`와 `checkLimit()` 모두 Redis 예외 시 `allowed: true`를 반환합니다.

의미
- 가용성은 높지만, 공격/폭주 상황에서 Redis 장애가 발생하면 보호막도 함께 사라집니다.

## 2. 성공 기반 제한은 원자적이지 않다
- `checkLimit()`는 읽기만 하고, 실제 증가는 나중에 `checkAndIncrement()`에서 합니다.
- 따라서 동시성 높은 상황에서는 여러 요청이 동시에 pre-check를 통과할 수 있습니다.

대표 위치
- [../../src/modules/user/account/guards/registration-limit.guard.ts](../../src/modules/user/account/guards/registration-limit.guard.ts)
- [../../src/modules/user/account/application/register-user.service.ts](../../src/modules/user/account/application/register-user.service.ts)

실무 의미
- “대략적인 일일 제한”에는 충분할 수 있습니다.
- 하지만 엄격한 상한 보장이 필요하면 락 또는 원자적 스크립트가 추가로 필요합니다.

## 3. 첫 요청의 카운트 증가와 TTL 설정은 단일 원자 연산이 아니다
- 현재 구현은 `INCR` 후 `TTL`을 조회하고, TTL이 없으면 `EXPIRE`를 따로 설정합니다.
- 즉, 첫 요청의 윈도우 초기화는 Lua script나 `SET ... EX NX` 같은 단일 연산으로 묶여 있지 않습니다.

[주의]
- 일반적인 상황에서는 충분히 동작합니다.
- 하지만 극단적인 장애/프로세스 중단 시점에서는 TTL이 잠시 누락될 가능성을 이론적으로 배제할 수 없습니다.

## 4. `ThrottleScope.USER`는 비인증 요청에서 `anonymous`로 묶인다
- `getUserKey()`는 `(request.user as any)?.id || 'anonymous'`를 사용합니다.

의미
- 인증이 보장되지 않은 엔드포인트에 USER scope를 붙이면, 익명 요청 전체가 하나의 공유 버킷을 사용하게 됩니다.
- 현재 확인된 USER scope 예시는 인증된 경로에 사용되고 있습니다.

## 5. 키는 경로 단위로 나뉘므로 전역 보호가 아니다
- 기본 키는 `ip/user/global + method + path` 조합입니다.
- 즉, 로그인 제한과 비밀번호 재설정 제한은 서로 다른 버킷입니다.

의미
- endpoint별 rate limit에는 적합합니다.
- “서비스 전체에서 이 IP는 분당 총 N회” 같은 정책은 custom/global key 설계가 별도로 필요합니다.

## 6. `resetKeysByPattern()`은 Redis `KEYS`를 사용한다
- 운영 환경에서 패턴 대상이 많아지면 비싼 호출이 될 수 있습니다.
- 현재 검색 기준 이 메서드의 대표 사용처는 보이지 않습니다.

## 7. 전용 테스트가 보이지 않는다
- 현재 검색 기준 `src`와 `test` 아래에 Throttle 전용 spec/integration 테스트 파일이 없습니다.
- 따라서 Guard 헤더, Redis 장애 fail-open, USER scope fallback, 동시성 race는 자동 검증 근거가 보이지 않습니다.

## 8. HTTP 헤더는 Guard 경유 요청에만 추가된다
- `ThrottleGuard`는 성공 시 `X-RateLimit-*` 헤더를 설정합니다.
- 하지만 `ThrottleService`를 직접 호출하는 경로는 헤더를 내려주지 않습니다.

실무 의미
- 동일한 쓰로틀 인프라를 써도, 클라이언트가 quota 메타데이터를 볼 수 있는지는 호출 방식에 따라 다릅니다.

새 작업 시 체크리스트
1. 이 제한이 HTTP endpoint 보호인지, 성공한 비즈니스 작업 수 제한인지, 비HTTP 인프라 보호인지 먼저 구분
2. HTTP endpoint 보호면 `@Throttle(...)`로 충분한지 확인
3. 성공 시에만 quota를 소비해야 하면 `checkLimit()` + 성공 후 `checkAndIncrement()` 패턴 사용
4. scope가 `IP`, `USER`, `GLOBAL`, `CUSTOM` 중 무엇이어야 하는지 먼저 결정
5. USER scope 사용 시 인증이 보장되는 경로인지 확인
6. strict atomicity가 필요하면 현재 구현만으로 충분한지 재검토
7. 운영 도구에서 패턴 삭제가 필요하면 `KEYS` 비용을 감안

변경 시 특히 조심할 점
- `keyPrefix` 변경: 기존 Redis 쓰로틀 키와 호환성 깨짐
- 기본 키 생성 규칙 변경: 기존 endpoint별 quota 의미가 바뀜
- fail-open 정책 변경: Redis 장애 시 전체 시스템 체감 동작이 바뀜
- `ThrottleGuard` 예외 형식 변경: 프론트/클라이언트 429 처리 로직에 영향
- `ThrottleScope.USER` 규칙 변경: 인증/비인증 경로에 영향
- `checkLimit()`/`checkAndIncrement()` 관계 변경: 성공 기반 제한 시나리오에 영향

요약 결론
- 이 쓰로틀 모듈의 본질은 “전역 가드”보다 [../../src/infrastructure/throttle/throttle.service.ts](../../src/infrastructure/throttle/throttle.service.ts) 에 있는 Redis 카운터 관리 로직입니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - HTTP 데코레이터형 제한과 서비스 직접 호출형 제한이 같은 서비스 위에서 공존한다는 점
  - 현재 기본 정책은 endpoint별 버킷 + Redis 장애 시 fail-open이라는 점
  - 성공 기반 제한은 유연하지만 원자적이지 않아서, 운영 정책에 따라 추가 보강이 필요할 수 있다는 점