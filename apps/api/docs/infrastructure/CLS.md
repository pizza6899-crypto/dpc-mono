# CLS 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/cls`

간단 요약
- 목적: 요청 단위 컨텍스트를 애플리케이션 전역에서 안전하게 조회할 수 있도록 만드는 공통 인프라입니다.
- 핵심 책임: trace/request ID 보존, 요청별 사용자/클라이언트 정보 공유, Prisma 트랜잭션 컨텍스트 연동, WebSocket 및 백그라운드 작업에서 CLS 실행 컨텍스트 유지.
- 이 모듈의 핵심 가치는 “매번 Request 객체를 파라미터로 넘기지 않고도 서비스 계층에서 현재 요청 정보를 읽을 수 있게 하는 것”입니다.

소스 구성
- [../../src/infrastructure/cls/cls.module.ts](../../src/infrastructure/cls/cls.module.ts) — `nestjs-cls` 전역 설정 및 Prisma transactional plugin 연결
- [../../src/infrastructure/cls/request-context.types.ts](../../src/infrastructure/cls/request-context.types.ts) — CLS store 타입 정의
- [../../src/infrastructure/cls/request-context.service.ts](../../src/infrastructure/cls/request-context.service.ts) — 서비스 계층용 컨텍스트 조회 API

관련 연동 지점
- [../../src/infrastructure/prisma/prisma.module.ts](../../src/infrastructure/prisma/prisma.module.ts) — `CustomClsModule` import/export
- [../../src/common/http/interceptors/request-info.interceptor.ts](../../src/common/http/interceptors/request-info.interceptor.ts) — HTTP 요청 정보를 CLS에 주입
- [../../src/common/http/utils/request-info.util.ts](../../src/common/http/utils/request-info.util.ts) — `RequestClientInfo` 생성
- [../../src/infrastructure/logger/logger.module.ts](../../src/infrastructure/logger/logger.module.ts) — `req.id` 생성
- [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts) — WebSocket 연결 시 CLS context 시작
- [../../src/infrastructure/bullmq/base.processor.ts](../../src/infrastructure/bullmq/base.processor.ts) — 백그라운드 잡 처리 시 CLS context 시작

한눈에 보는 구조
1. 로거가 HTTP 요청마다 `req.id`를 생성하거나 기존 `x-request-id`를 재사용합니다.
2. CLS middleware가 요청 단위 저장소를 시작합니다.
3. `RequestInfoInterceptor`가 `clientInfo`, `user`를 CLS에 저장합니다.
4. 서비스 계층은 `RequestContextService`로 현재 유저, 세션, trace 정보에 접근합니다.
5. Prisma 트랜잭션 플러그인이 같은 CLS context 안에서 `@Transactional()`과 `@InjectTransaction()`을 연결합니다.
6. WebSocket과 BullMQ도 별도의 진입점에서 CLS context를 열어 트랜잭션/추적 일관성을 유지합니다.

아키텍처 핵심 포인트

## 1. 실제 진입점은 `PrismaModule`
- `CustomClsModule`은 별도 인프라 모듈이지만, 실제 애플리케이션 import 체인에서는 [../../src/infrastructure/prisma/prisma.module.ts](../../src/infrastructure/prisma/prisma.module.ts)를 통해 들어옵니다.
- [../../src/app.module.ts](../../src/app.module.ts)는 `PrismaModule`을 import하고 있으므로, 결과적으로 CLS가 전역 활성화됩니다.
- 즉, 현재 구조상 CLS는 “Prisma 트랜잭션 인프라와 결합된 전역 요청 컨텍스트 모듈”입니다.

## 2. 이 모듈은 데이터 저장소가 아니라 컨텍스트 저장소
- 여기서 저장하는 값은 DB 엔티티가 아니라 현재 실행 흐름에 귀속된 메타데이터입니다.
- 예시:
  - 현재 요청의 유저 정보
  - 현재 요청의 세션 ID
  - 현재 요청의 클라이언트 IP / 국가 / 브라우저
  - 현재 실행 중인 트랜잭션 컨텍스트
  - 현재 실행 중인 잡의 메타데이터

## 3. `RequestContextService`는 읽기 전용 추상화
- 현재 코드 기준으로 이 서비스는 값을 세팅하지 않습니다.
- 실제 쓰기 지점은 HTTP 인터셉터, CLS module setup, BullMQ processor, WebSocket adapter 같은 인프라 레이어입니다.
- 서비스 계층은 `RequestContextService`를 통해 읽기만 수행합니다.

파일별 상세 분석

## 1. `cls.module.ts`

역할
- `nestjs-cls`를 전역 활성화하고, Prisma transactional plugin을 연결합니다.

핵심 구성
- `@Global()`
- `ClsModule.forRoot({ global: true, middleware: { mount: true, setup }, plugins: [...] })`
- `RequestContextService` provider/export

### middleware 설정
- `mount: true`
  - HTTP 요청마다 CLS middleware를 자동 장착합니다.
- `setup: (cls, req) => { cls.set('id', req.id) }`
  - pino logger가 생성한 `req.id`를 CLS에 동기화하려는 의도입니다.

### Prisma Transactional plugin 설정
- `ClsPluginTransactional`
- `TransactionalAdapterPrisma`
- `prismaInjectionToken: EXTENDED_PRISMA_CLIENT`
- `sqlFlavor: 'postgresql'`
- `enableTransactionProxy: true`

실무 의미
- 이 설정 덕분에 서비스에서 `@Transactional()`을 쓰고, 리포지토리에서 `@InjectTransaction()`으로 Prisma transaction을 주입받을 수 있습니다.
- 같은 논리 요청 흐름 안에서 트랜잭션 컨텍스트가 CLS를 통해 전달됩니다.

## 2. `request-context.types.ts`

역할
- CLS store의 타입 계약을 정의합니다.

현재 정의된 필드
- `user: AuthenticatedUser | null`
- `clientInfo: RequestClientInfo | null`

실무 의미
- HTTP 요청 기준으로 서비스 계층에서 필요로 하는 컨텍스트는 대체로 이 두 객체 안에 모여 있습니다.
- `traceId`, `sessionId`, `ip`, `country`, `browser` 같은 값은 `clientInfo`에서 파생됩니다.

주의점
- 타입 정의에는 `jobId`, `queueName`, `attempt` 같은 백그라운드 잡 메타데이터가 없습니다.
- 그러나 실제로는 [../../src/infrastructure/bullmq/base.processor.ts](../../src/infrastructure/bullmq/base.processor.ts)에서 이런 값들을 CLS에 세팅합니다.
- 즉, 현재 타입은 “HTTP 요청 컨텍스트 중심”이고, CLS 전체 키 공간을 완전하게 기술하는 타입은 아닙니다.

## 3. `request-context.service.ts`

역할
- 서비스 계층에서 자주 쓰는 CLS 값을 의미 있는 메서드로 감싼 조회 서비스입니다.

메서드 그룹

### 트레이싱
- `getTraceId()`

### 유저 정보
- `getUser()`
- `getUserId()`
- `getNickname()`
- `getEmail()`
- `getUserRole()`
- `getUserStatus()`
- `getLanguage()`
- `getPrimaryCurrency()`
- `getPlayCurrency()`
- `isEmailVerified()`
- `isIdentityVerified()`

### 클라이언트 / 디바이스 정보
- `getClientInfo()`
- `getDeviceId()`
- `getSessionId()`
- `getIpAddress()`
- `getCountryCode()`

설계 특징
- 대부분의 메서드는 `null` 또는 기본값을 반환합니다.
- 즉, 호출부가 HTTP 요청 내부라고 가정하지 않고도 사용할 수 있게 방어적으로 작성되어 있습니다.
- 예를 들어 `getTraceId()`는 값이 없으면 `'background'`를 반환합니다.

실무 의미
- 서비스 계층이 `Request`, `ExecutionContext`, `Socket`, `req.user` 구조를 직접 알 필요가 없어집니다.
- 이 덕분에 컨트롤러 바깥의 application service도 현재 유저와 trace 정보를 사용할 수 있습니다.

런타임 흐름 분석

## 1. HTTP 요청 흐름

### 1단계. Request ID 생성
- [../../src/infrastructure/logger/logger.module.ts](../../src/infrastructure/logger/logger.module.ts)의 `genReqId`가 요청 ID를 생성합니다.
- 우선순위:
  - 클라이언트가 보낸 `x-request-id`
  - 없으면 `randomUUID()`

### 2단계. CLS middleware 시작
- [../../src/infrastructure/cls/cls.module.ts](../../src/infrastructure/cls/cls.module.ts)의 CLS middleware가 요청 단위 store를 생성합니다.
- `setup`에서 `req.id`를 CLS에 넣으려 합니다.

### 3단계. 요청 메타데이터 추출
- [../../src/common/http/interceptors/request-info.interceptor.ts](../../src/common/http/interceptors/request-info.interceptor.ts)가 실행됩니다.
- 여기서:
  - `extractClientInfo(request)` 호출
  - `request.clientInfo` 저장
  - `cls.set('clientInfo', request.clientInfo)`
  - 인증 유저가 있으면 `cls.set('user', user)`
  - `x-request-id` 응답 헤더 추가

### 4단계. 서비스 계층에서 접근
- 이후 application service / domain service는 `RequestContextService`를 주입받아 현재 요청 정보를 읽습니다.

대표 사용처
- [../../src/modules/universal-log/application/create-universal-log.service.ts](../../src/modules/universal-log/application/create-universal-log.service.ts)
- [../../src/modules/artifact/draw/application/request-artifact-draw.service.ts](../../src/modules/artifact/draw/application/request-artifact-draw.service.ts)
- [../../src/modules/artifact/draw/application/claim-artifact-draw.service.ts](../../src/modules/artifact/draw/application/claim-artifact-draw.service.ts)
- [../../src/modules/artifact/synthesis/application/synthesize-artifact.service.ts](../../src/modules/artifact/synthesis/application/synthesize-artifact.service.ts)

## 2. RequestClientInfo 생성 규칙
- [../../src/common/http/utils/request-info.util.ts](../../src/common/http/utils/request-info.util.ts)가 실제 메타데이터 추출을 담당합니다.

포함되는 값
- IP, protocol, method, path, timestamp
- traceId 후보
- Cloudflare 추적 정보 (`cfRay` 등)
- 지리 정보 (`country`, `city`, `timezone` 등)
- 네트워크/보안 정보 (`isp`, `asn`, `threat`, `bot` 등)
- 브라우저/OS/모바일 여부
- `sessionId`
- `fingerprint`

traceId 우선순위
1. `request.id`
2. `x-trace-id`
3. `x-request-id`
4. `traceparent`

fingerprint 생성 규칙
- `x-device-id`가 있으면 그대로 사용
- 없으면 UA, 언어, Client Hint 계열 헤더를 조합해 SHA-256 해시를 생성
- IP는 fingerprint seed에서 제외합니다.

실무 의미
- 서비스가 단순히 `RequestContextService.getClientInfo()`만 호출해도, 이미 상당히 풍부한 클라이언트 정보에 접근할 수 있습니다.

## 3. Prisma 트랜잭션 흐름

실제 사용 패턴
- 서비스 계층: `@Transactional()`
- 리포지토리 계층: `@InjectTransaction()`

검색 기준 관찰
- `@Transactional()`과 `@InjectTransaction()`은 레포 전반에서 넓게 사용됩니다.
- 예시:
  - 다수의 application service
  - 다수의 Prisma repository

연결 방식
1. `PrismaModule`이 `CustomClsModule`을 import
2. `CustomClsModule`이 transactional plugin을 활성화
3. `EXTENDED_PRISMA_CLIENT` 기반으로 트랜잭션 프록시가 구성
4. 같은 CLS context 안에서 서비스와 리포지토리가 동일 트랜잭션을 공유

실무 의미
- 컨트롤러에서 transaction 객체를 직접 넘기지 않아도 서비스/리포지토리 간 원자적 작업을 구성할 수 있습니다.
- 이 구조 덕분에 트랜잭션 경계가 메서드 데코레이터 수준으로 올라옵니다.

관련 테스트
- [../../src/infrastructure/prisma/cls.module.spec.ts](../../src/infrastructure/prisma/cls.module.spec.ts)
- [../../src/infrastructure/prisma/prisma.module.spec.ts](../../src/infrastructure/prisma/prisma.module.spec.ts)

테스트 수준에 대한 관찰
- 현재 테스트는 “모듈이 연결되어 있는지”를 검증하는 수준입니다.
- 실제 trace ID 전파, user/clientInfo 전파, 중첩 트랜잭션, WebSocket 트랜잭션 전파까지 검증하는 통합 테스트는 보이지 않습니다.

## 4. WebSocket 흐름
- [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts)는 소켓 연결마다 `this.clsService.run(() => next())`를 호출합니다.
- 이 목적은 WebSocket 핸들러에서도 `@Transactional()`이 동작하도록 하는 것입니다.

중요한 관찰
- 현재 검색 범위에서는 WebSocket 경로에서 `cls.set('user', ...)`, `cls.set('clientInfo', ...)`, `cls.set('id', ...)`를 추가로 세팅하는 코드는 보이지 않습니다.
- 즉, WebSocket은 CLS context 자체는 생성하지만, HTTP 요청처럼 `RequestContextService`가 기대하는 사용자/클라이언트 정보까지 자동으로 채우지는 않습니다.

실무 의미
- WebSocket 핸들러에서 CLS 기반 트랜잭션은 가능할 수 있습니다.
- 하지만 `RequestContextService.getUserId()`나 `getClientInfo()`는 기대와 다르게 `null`일 수 있습니다.

## 5. 백그라운드 잡(BullMQ) 흐름
- [../../src/infrastructure/bullmq/base.processor.ts](../../src/infrastructure/bullmq/base.processor.ts)는 `this.cls.run(async () => ...)`으로 잡별 CLS context를 생성합니다.
- 여기에 저장하는 값:
  - `jobId`
  - `queueName`
  - `attempt`

실무 의미
- 워커 내부에서도 CLS는 단순히 HTTP용이 아니라 “실행 흐름 컨텍스트”로 사용됩니다.
- 다만 이 값들은 `RequestContextService`가 노출하는 API와는 별개입니다.
- 따라서 잡 처리 로직에서 request-style context를 기대하면 안 됩니다.

실제 사용 패턴

## 1. 요청 컨텍스트 기반 로깅
대표 예시: [../../src/modules/universal-log/application/create-universal-log.service.ts](../../src/modules/universal-log/application/create-universal-log.service.ts)

이 서비스가 CLS에서 읽는 값
- `traceId`
- `sessionId`
- `deviceId`
- `ipAddress`
- `countryCode`
- `clientInfo.userAgent`
- `clientInfo.path`
- `clientInfo.method`
- `user`

의미
- 로깅 코드가 `Request` 객체에 직접 의존하지 않고도 풍부한 요청 문맥을 확보합니다.

## 2. 현재 사용자 기반 비즈니스 로직
대표 예시:
- [../../src/modules/artifact/draw/application/list-unclaimed-draws.service.ts](../../src/modules/artifact/draw/application/list-unclaimed-draws.service.ts)
- [../../src/modules/artifact/draw/application/request-artifact-draw.service.ts](../../src/modules/artifact/draw/application/request-artifact-draw.service.ts)
- [../../src/modules/artifact/inventory/application/equip-artifact.service.ts](../../src/modules/artifact/inventory/application/equip-artifact.service.ts)

패턴
- 서비스가 `RequestContextService.getUserId()`를 호출해 현재 로그인 사용자 ID를 얻습니다.
- 이 방식은 컨트롤러에서 userId를 매번 파라미터로 넘기는 보일러플레이트를 줄여 줍니다.

## 3. 트랜잭션 경계 표준화
검색 기준으로 `@Transactional()`과 `@InjectTransaction()`은 레포 전반에 매우 넓게 퍼져 있습니다.

의미
- 이 CLS 모듈은 단순 편의 기능이 아니라, 현재 프로젝트에서 Prisma 트랜잭션 모델의 기반입니다.
- 이 계층이 깨지면 서비스/리포지토리의 트랜잭션 일관성이 함께 흔들립니다.

중요 관찰 및 주의사항

## 1. trace ID 동기화 구현에 주의가 필요함
- [../../src/infrastructure/cls/cls.module.ts](../../src/infrastructure/cls/cls.module.ts)는 `cls.set('id', req.id)`를 수행합니다.
- 반면 [../../src/infrastructure/cls/request-context.service.ts](../../src/infrastructure/cls/request-context.service.ts)의 `getTraceId()`는 `this.cls.getId()`를 사용합니다.
- 로컬 설치본 `nestjs-cls` 구현상 `getId()`는 일반 문자열 키 `'id'`가 아니라 CLS 전용 내부 ID(`CLS_ID`)를 읽습니다.
- 그리고 라이브러리 타입 정의상 이 ID는 `generateId` 옵션이 켜져 있을 때만 보장됩니다.

현재 코드 기준 해석
- 코드 주석상 의도는 “pino req.id와 traceId 동기화”입니다.
- 하지만 현재 설정만 보면 `getTraceId()`가 의도대로 `req.id`를 반환하지 못할 가능성이 있습니다.

[주의]
- 이 문서는 코드 분석 결과를 적은 것이고, 실제 런타임 검증은 수행하지 않았습니다.
- 다만 소스 코드와 로컬 설치 라이브러리 정의를 보면 이 부분은 별도 확인이 필요한 지점입니다.

## 2. HTTP 중심 설계
- `user`, `clientInfo`를 CLS에 넣는 코드는 현재 [../../src/common/http/interceptors/request-info.interceptor.ts](../../src/common/http/interceptors/request-info.interceptor.ts)에만 보입니다.
- 따라서 `RequestContextService`는 본질적으로 HTTP 요청 컨텍스트에 가장 최적화되어 있습니다.

## 3. WebSocket과 Background는 partial context
- WebSocket은 CLS context만 시작합니다.
- BullMQ는 job metadata만 넣습니다.
- 둘 다 HTTP 수준의 `RequestContextService` 데이터가 자동으로 채워지는 구조는 아닙니다.

## 4. `RequestContextService`는 setter가 없음
- 값 세팅이 여러 인프라 진입점으로 분산되어 있기 때문에, 새 진입점(예: GraphQL, CLI, 새로운 consumer)을 추가할 때는 CLS context 초기화와 세팅 전략을 직접 설계해야 합니다.

새 작업 시 체크리스트
1. HTTP 요청 기반 기능이면 `RequestContextService`로 필요한 정보가 이미 제공되는지 먼저 확인
2. 새로운 요청 메타데이터가 필요하면 `RequestClientInfo`와 `extractClientInfo()` 확장 여부 검토
3. 새로운 실행 진입점(WebSocket/Queue/Cron/CLI)을 만들면 CLS context를 어디서 시작할지 먼저 결정
4. Prisma 트랜잭션이 필요한 서비스는 `@Transactional()` 패턴을 따르고, 리포지토리는 `@InjectTransaction()` 사용
5. WebSocket이나 background 작업에서 `RequestContextService`를 쓸 경우 `null` 가능성을 반드시 고려
6. traceId가 중요한 기능이라면 현재 `getTraceId()` 동작을 별도 검증

변경 시 특히 조심할 점
- `cls.module.ts`의 plugin 설정 변경: 전체 트랜잭션 모델에 영향
- `request-info.interceptor.ts` 변경: 모든 요청 컨텍스트 필드에 영향
- `request-info.util.ts` 변경: 로그, 감사, 분석 데이터 품질에 영향
- `RequestContextService.getTraceId()` 변경: 로깅/추적 체계 전반에 영향
- WebSocket adapter의 CLS 초기화 변경: WS 트랜잭션 동작에 영향

요약 결론
- 이 CLS 모듈은 단순한 편의 서비스가 아니라, 현재 프로젝트에서 “요청 문맥 공유”와 “Prisma 트랜잭션 전파”를 동시에 떠받치는 핵심 인프라입니다.
- 가장 중요한 이해 포인트는 세 가지입니다.
  - HTTP 요청에서는 `RequestInfoInterceptor`를 통해 `user`와 `clientInfo`가 CLS에 들어간다는 점
  - 트랜잭션 전파는 `CustomClsModule`과 Prisma transactional plugin 결합 위에서 동작한다는 점
  - WebSocket/백그라운드 작업은 CLS context는 만들지만 HTTP와 동일한 컨텍스트 필드를 자동 주입하지는 않는다는 점