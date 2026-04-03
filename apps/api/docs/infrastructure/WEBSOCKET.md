---
module: websocket
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: infrastructure-module
audience:
  - ai-agent
  - human
docStatus: canonical
topics:
  - websocket
  - socket.io
  - sessions
  - redis-adapter
  - realtime-push
tasks:
  - trace-socket-auth
  - debug-room-delivery
  - inspect-websocket-session
relatedDocs:
  - README.md
  - CLS.md
  - THROTTLE.md
trustLevel: medium
owner: infrastructure-websocket
reviewResponsibility:
  - review when adapter auth chain, namespaces, room naming, or event envelope contract changes
  - review when hook execution flow or session create/expire integration changes
  - review when socket connection throttle or CLS behavior changes
sourceRoots:
  - ../../src/infrastructure/websocket
---

# WebSocket 인프라 모듈 가이드

경로: `apps/api/src/infrastructure/websocket`

간단 요약
- 목적: HTTP 세션 쿠키 기반 인증을 재사용해 Socket.IO 연결을 수립하고, 사용자/관리자 실시간 푸시를 공통 방식으로 제공하는 인프라입니다.
- 핵심 책임: 네임스페이스별 인증 미들웨어 적용, Redis adapter 기반 수평 확장, DB WebSocket 세션 생성/종료, 룸 기반 브로드캐스트, 타입 안전한 이벤트 페이로드 계약 제공.
- 이 모듈은 “클라이언트가 WebSocket으로 명령을 보내는 채널”이라기보다, REST/백그라운드 작업 결과를 실시간으로 전달하는 서버 푸시 인프라에 가깝습니다.

이 문서를 먼저 읽어야 하는 질문
- 실제 인증 경계는 게이트웨이인가 `SessionIoAdapter`인가?
- 연결 훅, 룸 조인, 서버 푸시는 어디서 수행되는가?
- `sendToUser()`와 `sendToRoom()`은 언제 각각 써야 하는가?

관련 sibling 문서
- [CLS.md](CLS.md) — WebSocket 경로에서 CLS 컨텍스트가 어떻게 시작되고 어떤 한계가 있는지 같이 봐야 합니다.
- [THROTTLE.md](THROTTLE.md) — 소켓 핸드셰이크 보호가 어떤 키와 정책으로 동작하는지 바로 이어서 확인할 수 있습니다.
- [PRISMA.md](PRISMA.md) — WebSocket 세션 생성/종료가 실제 DB 접근 계층과 어떻게 연결되는지 추적할 때 필요합니다.

소스 구성
- [../../src/infrastructure/websocket/websocket.module.ts](../../src/infrastructure/websocket/websocket.module.ts) — 전역 모듈 등록
- [../../src/infrastructure/websocket/websocket.service.ts](../../src/infrastructure/websocket/websocket.service.ts) — 외부 모듈용 송신/룸 조작 facade
- [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts) — Socket.IO 서버 어댑터, 세션/패스포트/CLS/Redis 연결
- [../../src/infrastructure/websocket/gateways/user-websocket.gateway.ts](../../src/infrastructure/websocket/gateways/user-websocket.gateway.ts) — 일반 사용자 네임스페이스(`/`) 게이트웨이
- [../../src/infrastructure/websocket/gateways/admin-websocket.gateway.ts](../../src/infrastructure/websocket/gateways/admin-websocket.gateway.ts) — 관리자 네임스페이스(`/admin`) 게이트웨이
- [../../src/infrastructure/websocket/constants/websocket-rooms.constant.ts](../../src/infrastructure/websocket/constants/websocket-rooms.constant.ts) — 룸 네이밍 규칙
- [../../src/infrastructure/websocket/types/socket-payload.types.ts](../../src/infrastructure/websocket/types/socket-payload.types.ts) — 이벤트 타입 및 페이로드 타입 계약
- [../../src/infrastructure/websocket/dtos/socket-event.dto.ts](../../src/infrastructure/websocket/dtos/socket-event.dto.ts) — 실제 전송 envelope DTO
- [../../src/infrastructure/websocket/interfaces/connection-hook.interface.ts](../../src/infrastructure/websocket/interfaces/connection-hook.interface.ts) — 연결 시 비즈니스 훅 인터페이스

관련 연동 지점
- [../../src/main.ts](../../src/main.ts) — `SessionIoAdapter` 생성 및 `app.useWebSocketAdapter(...)` 등록
- [../../src/app.module.ts](../../src/app.module.ts) — `WebsocketModule` import
- [../../src/modules/auth/session/application/create-session.service.ts](../../src/modules/auth/session/application/create-session.service.ts) — WebSocket 세션 생성
- [../../src/modules/auth/session/application/expire-session.service.ts](../../src/modules/auth/session/application/expire-session.service.ts) — WebSocket 세션 종료
- [../../src/infrastructure/throttle/throttle.service.ts](../../src/infrastructure/throttle/throttle.service.ts) — 핸드셰이크 쓰로틀링
- [../../src/infrastructure/cls/cls.module.ts](../../src/infrastructure/cls/cls.module.ts) — WebSocket용 CLS 컨텍스트 시작점과 연동
- [../../src/modules/chat/rooms/chat-rooms.module.ts](../../src/modules/chat/rooms/chat-rooms.module.ts) — 일반 채팅방 연결 훅 등록
- [../../src/modules/chat/support/chat-support.module.ts](../../src/modules/chat/support/chat-support.module.ts) — 상담방 연결 훅 등록

대표 사용처
- 사용자 개인 알림 발송
  - [../../src/modules/notification/infrastructure/processors/inbox.processor.ts](../../src/modules/notification/infrastructure/processors/inbox.processor.ts)
- 채팅방 브로드캐스트
  - [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
  - [../../src/modules/chat/rooms/application/read-chat-messages.service.ts](../../src/modules/chat/rooms/application/read-chat-messages.service.ts)
- 관리자 대시보드 실시간 알림
  - [../../src/modules/chat/support/application/send-support-message.service.ts](../../src/modules/chat/support/application/send-support-message.service.ts)
  - [../../src/modules/deposit/application/create-fiat-deposit.service.ts](../../src/modules/deposit/application/create-fiat-deposit.service.ts)
- 연결 시 룸 동기화 훅
  - [../../src/modules/chat/rooms/application/chat-room-membership-hook.service.ts](../../src/modules/chat/rooms/application/chat-room-membership-hook.service.ts)
  - [../../src/modules/chat/support/application/support-room-assignment-hook.service.ts](../../src/modules/chat/support/application/support-room-assignment-hook.service.ts)

한눈에 보는 구조
1. 부트 시점에 [../../src/main.ts](../../src/main.ts)에서 `SessionIoAdapter`를 생성합니다.
2. 어댑터는 네임스페이스별로 `cookieParser -> session -> passport -> CLS` 미들웨어 체인을 장착합니다.
3. 게이트웨이는 `client.request.user`를 읽어 인증/권한을 판별하고, DB에 `SessionType.WEBSOCKET` 세션을 생성합니다.
4. 연결이 완료되면 `WebsocketService.executeConnectHooks()`가 실행되어 채팅방 자동 조인 같은 후처리를 수행합니다.
5. 비즈니스 서비스는 게이트웨이를 직접 쓰지 않고 `WebsocketService.sendToUser()` 또는 `sendToRoom()`만 호출합니다.
6. 실제 클라이언트 수신 메시지는 `{ type, payload, timestamp }` 형태의 envelope로 고정됩니다.

아키텍처 핵심 포인트

## 1. 실제 인증 경계는 게이트웨이가 아니라 `SessionIoAdapter`
- 게이트웨이는 `req.user`를 “읽기만” 합니다.
- 쿠키 파싱, 세션 복원, Passport 세션 주입, CLS 컨텍스트 시작은 모두 [../../src/infrastructure/websocket/adapters/session-io.adapter.ts](../../src/infrastructure/websocket/adapters/session-io.adapter.ts)에서 처리됩니다.
- 즉, 어댑터가 빠지면 게이트웨이는 인증된 사용자 정보를 받을 수 없습니다.

## 2. 네임스페이스는 두 개, 이벤트 envelope는 하나
- 일반 사용자/게스트: `/`
- 관리자: `/admin`
- 그러나 발송 이벤트 이름은 `WebsocketService` 내부 상수 `EVENT_NAME = 'events'` 하나로 고정되어 있습니다.
- 페이로드 구분은 이벤트 이름이 아니라 envelope 내부 `type` 필드로 수행됩니다.

실무 의미
- 프론트는 `socket.on('events', handler)` 한 개만 리슨하고, `message.type`으로 분기하는 구조를 전제합니다.
- 이 설계는 이벤트 채널 수를 줄이는 대신, envelope 타입 계약을 엄격하게 유지해야 합니다.

## 3. 이 모듈은 서버 푸시 전용에 가깝다
- 현재 검색 기준 `@SubscribeMessage()` 핸들러가 없습니다.
- 게이트웨이 구현은 `handleConnection`, `handleDisconnect`, 문서용 dummy 메서드만 포함합니다.
- 상태 변경이나 명령 처리는 REST/API 서비스가 담당하고, WebSocket은 결과 전파만 담당합니다.

## 4. 연결 후 비즈니스 후처리는 훅으로 확장한다
- `WebsocketService`는 `hooks: OnWebsocketConnectHook[]` 배열을 내부에 유지합니다.
- 각 모듈은 `OnModuleInit`에서 `registerHook()`을 호출해 연결 후 룸 동기화 로직을 주입합니다.
- 현재는 채팅방 멤버십 동기화, 관리자 상담방 배정 동기화가 이 메커니즘을 사용합니다.

## 5. 게이트웨이는 외부에 노출되지 않고 `WebsocketService`만 공개된다
- [../../src/infrastructure/websocket/websocket.module.ts](../../src/infrastructure/websocket/websocket.module.ts)는 `@Global()`입니다.
- 하지만 export는 `WebsocketService` 하나뿐입니다.
- 따라서 다른 모듈이 게이트웨이 메서드를 직접 호출하는 것이 아니라, 인프라 facade 하나로 통제하려는 의도가 분명합니다.

파일별 상세 분석

## 1. `websocket.module.ts`

역할
- 사용자/관리자 게이트웨이와 `WebsocketService`를 전역 provider로 등록합니다.

핵심 특징
- `@Global()`이라서 AppModule 한 번 import 후 어디서나 주입 가능합니다.
- `SessionModule`을 import하므로 게이트웨이에서 세션 생성/만료 서비스 주입이 가능합니다.
- 외부 export는 `WebsocketService` 하나뿐입니다.

의미
- 게이트웨이는 인프라 내부 구현 세부사항으로 숨기고, 다른 모듈에는 “메시지 보낸다 / 룸 가입시킨다” 수준의 API만 제공합니다.

## 2. `session-io.adapter.ts`

역할
- Socket.IO 서버 생성 시 네임스페이스별 Express middleware를 장착하고, Redis adapter와 CLS를 연결합니다.

### 생성자
- Nest 컨테이너에서 `ClsService`, `ThrottleService`를 직접 `app.get()`으로 가져옵니다.
- 외부에서 전달받는 것은 middleware 묶음과 optional Redis 설정뿐입니다.

### `connectToRedis()`
- Redis 설정이 있으면 `ioredis` pub/sub 클라이언트를 만들고 `@socket.io/redis-adapter`를 구성합니다.
- 설정이 없으면 단일 프로세스 모드로 동작합니다.

의미
- 멀티 인스턴스 환경에서도 룸 join/emit 상태를 공유하려는 의도입니다.

### `createIOServer()`
- 기본 서버를 만든 뒤 Redis adapter를 적용합니다.
- Express middleware를 Socket.IO middleware 형식으로 감싸는 `wrap()` 헬퍼를 정의합니다.
- 이후 네임스페이스별 미들웨어 체인을 설정합니다.

#### CLS middleware
- `this.clsService.run(() => next())`
- 목적은 WebSocket 경로에서도 `@Transactional()`이 동작하도록 실행 컨텍스트를 여는 것입니다.

#### Handshake throttle middleware
- 키: `socket_handshake:${ip}`
- 정책: `10초당 120회`
- 초과 시 `Too many connection attempts...` 에러를 반환합니다.

#### 사용자 네임스페이스(`/`) 체인
1. handshake throttle
2. cookie parser
3. user session middleware
4. passport initialize
5. passport session
6. CLS middleware

#### 관리자 네임스페이스(`/admin`) 체인
1. handshake throttle
2. cookie parser
3. admin session middleware
4. passport initialize
5. passport session
6. CLS middleware

중요한 관찰
- HTTP와 같은 세션/Passport 체인을 재사용하기 때문에, 핸드셰이크는 사실상 “쿠키 기반 세션 인증을 수행하는 HTTP 미들웨어 파이프라인” 위에서 돌아갑니다.
- CLS context는 생성하지만, 현재 코드 기준 WebSocket 경로에서 `cls.set('user', ...)` 같은 추가 컨텍스트 세팅은 보이지 않습니다.

## 3. `user-websocket.gateway.ts`

역할
- 기본 네임스페이스(`/`) 연결과 해제를 담당합니다.

### `handleConnection(client)`

공통 처리
- 연결 즉시 모든 `/` 소켓은 `SOCKET_ROOMS.GLOBAL`에 가입합니다.

인증 사용자 흐름
1. `client.request.user`에서 인증 유저 추출
2. 개인 룸 `user:${userId}` 가입
3. DB에 `SessionType.WEBSOCKET` 세션 생성
4. `executeConnectHooks(client, user.id, false)` 실행

세션 생성에 저장되는 값
- `sessionId = client.id`
- `parentSessionId = req.sessionID`
- `isAdmin = false`
- `deviceInfo.ipAddress = client.handshake.address`
- `deviceInfo.userAgent = client.handshake.headers['user-agent']`
- `expiresAt = session cookie expires || 24시간 fallback`

게스트 흐름
- `req.user`가 없으면 `SOCKET_ROOMS.LOBBY`에 가입합니다.
- 즉, 게스트도 `/` 네임스페이스 연결은 허용되며, lobby/global 브로드캐스트 수신 대상이 됩니다.

오류 처리
- DB 세션 생성 또는 hook 실행 실패 시 연결을 강제 종료합니다.

### `handleDisconnect(client)`
- 연결 시 저장한 `client.user`가 있으면 `ExpireSessionService`로 WebSocket 세션을 만료 처리합니다.
- 이미 부모 세션 종료 등으로 선처리된 경우는 debug 로그만 남기고 무시합니다.

### 송신 메서드
- `emitToUser(userId, event, data)` → `user:${id}` 룸
- `emitToRoom(room, event, data)` → 특정 룸
- `emitToAll(event, data)` → `/` 전체 브로드캐스트

중요한 관찰
- 외부 비즈니스 서비스는 보통 이 메서드를 직접 호출하지 않고 `WebsocketService`를 사용합니다.
- `emitToAll()`은 현재 검색 기준 사용처가 없습니다.

### AsyncAPI 문서용 dummy 메서드
- `@AsyncApiPub()`가 붙은 `_documentEventStream()`은 실제 로직이 없습니다.
- 문서 자동 생성을 위해서만 존재합니다.

## 4. `admin-websocket.gateway.ts`

역할
- 관리자 네임스페이스(`/admin`) 연결과 해제를 담당합니다.

### `handleConnection(client)`
권한 체크
- `req.user`가 있고 역할이 `ADMIN` 또는 `SUPER_ADMIN`이어야만 연결 허용
- 아니면 즉시 disconnect

성공 흐름
1. `SOCKET_ROOMS.ADMIN` 가입
2. 개인 룸 `admin:${adminId}` 가입
3. DB에 관리자 WebSocket 세션 생성 (`isAdmin = true`)
4. `executeConnectHooks(client, user.id, true)` 실행

의미
- 관리자용 브로드캐스트와 개인 알림을 일반 사용자와 네임스페이스 수준에서 분리합니다.

### `handleDisconnect(client)`
- 사용자 게이트웨이와 동일하게 세션 만료 처리

### 송신 메서드
- `emitToAdmin(adminId, event, data)` → `admin:${id}` 룸
- `emitToAdminRoom(event, data)` → 공용 `admin` 룸
- `emitToRoom(room, event, data)` → 관리자 네임스페이스의 임의 룸

중요한 관찰
- `emitToAdminRoom()`은 현재 검색 기준 직접 사용처가 없습니다.
- 외부 서비스는 `SOCKET_ROOMS.ADMIN`을 `sendToRoom()`에 넘겨 공용 관리자 알림을 발송하는 패턴을 사용합니다.

## 5. `websocket.service.ts`

역할
- 다른 모듈이 의존하는 공용 facade입니다.

### 내부 상태
- `hooks: OnWebsocketConnectHook[]`
- `EVENT_NAME = 'events'`

### `registerHook(hook)`
- 연결 후 실행할 훅을 배열에 추가합니다.
- 현재 등록은 [../../src/modules/chat/rooms/chat-rooms.module.ts](../../src/modules/chat/rooms/chat-rooms.module.ts), [../../src/modules/chat/support/chat-support.module.ts](../../src/modules/chat/support/chat-support.module.ts)에서 `onModuleInit()`로 수행됩니다.

### `executeConnectHooks(client, userId, isAdmin)`
- 등록된 훅을 `Promise.all(...)`로 병렬 실행합니다.

의미
- 여러 도메인이 연결 후 부가 작업을 독립적으로 얹을 수 있습니다.

주의점
- 훅 하나라도 reject되면 `Promise.all` 전체가 실패합니다.
- 현재 구현에서는 게이트웨이 쪽 `try/catch` 안에서 이 호출이 실행되므로, 처리되지 않은 훅 예외는 연결 종료로 이어집니다.
- 다만 현재 두 훅 구현은 내부에서 예외를 잡고 로그만 남깁니다.

### `sendToUser(userId, type, payload)`
- `SocketEventDto.create(type, payload)`로 envelope 생성
- 관리자 네임스페이스 개인 룸 `admin:${userId}`에도 emit
- 사용자 네임스페이스 개인 룸 `user:${userId}`에도 emit

실무 의미
- 동일 ID를 가진 소켓이 어느 네임스페이스에 연결되어 있어도 전달을 시도합니다.
- 일반 사용자에게는 `/admin` 쪽 룸이 없으므로 사실상 no-op이고, 관리자 계정은 양쪽 연결을 모두 가질 수 있다는 가정이 반영되어 있습니다.

### `sendToRoom(room, type, payload)`
- 관리자 네임스페이스와 사용자 네임스페이스 양쪽의 동일 룸 이름에 모두 emit 합니다.
- 공용 채팅방/상담방 실시간 이벤트에 적합한 API입니다.

### `joinChatRoom(userId, roomId, roomType)` / `leaveChatRoom(...)`
- 룸 타입이 `SUPPORT`면 `support:${roomId}`
- 그 외는 `chat:${roomId}`
- 대상 소켓 집합은 `this.gateway.server.in(getSocketRoom.user(userId))`

의미
- 구현상 `/` 네임스페이스의 `user:${id}` 룸에 속한 소켓만 join/leave 대상입니다.
- 이 메서드는 이름은 일반적이지만 실제로는 사용자 네임스페이스 중심 API입니다.

## 6. `websocket-rooms.constant.ts`

역할
- 룸 이름의 단일 규칙을 정의합니다.

고정 룸
- `ADMIN = 'admin'`
- `LOBBY = 'lobby'`
- `GLOBAL = 'global'`

동적 룸 생성기
- `user(userId)` → `user:${id}`
- `admin(adminId)` → `admin:${id}`
- `chat(roomId)` → `chat:${id}`
- `support(roomId)` → `support:${id}`

실무 의미
- 룸 이름 규칙이 한 파일에 모여 있어서 서비스/게이트웨이/훅 모두가 동일 네이밍을 공유합니다.
- 관리자 공용 룸 이름이 `admin`인데, 네임스페이스도 `/admin`이라 개념이 혼동될 수 있으므로 구분해서 이해해야 합니다.

## 7. `socket-payload.types.ts`

역할
- WebSocket 이벤트 종류와 페이로드 타입을 정의하는 단일 진실 공급원입니다.

이벤트 그룹
- 사용자 개인 알림: `INBOX_NEW`
- 공용 채팅 이벤트: `CHAT_MESSAGE_NEW`, `CHAT_MESSAGES_READ`, `SUPPORT_CHAT_MESSAGE_NEW`, `SUPPORT_CHAT_MESSAGES_READ`
- 관리자 전용 알림: `FIAT_DEPOSIT_REQUESTED`, `WITHDRAW_REQUESTED`, `SUPPORT_INQUIRY_RECEIVED`

핵심 포인트
- `SocketPayloadMap`이 `sendToUser()` / `sendToRoom()` generic 타입 추론의 근거입니다.
- 즉, 타입 안전성은 “public facade를 통해 보낼 때” 보장됩니다.
- 런타임 스키마 검증은 없고, TypeScript 컴파일 타임 계약만 존재합니다.

실무 의미
- 게이트웨이를 우회해 raw `emit()`을 직접 사용하면 타입 안전성을 잃게 됩니다.
- 현재 구조가 `WebsocketService` 사용을 강하게 유도하는 이유이기도 합니다.

## 8. `socket-event.dto.ts`

역할
- 실제 전송 envelope 형식 `{ type, payload, timestamp }`를 정의합니다.

중요한 점
- `timestamp`는 `SocketEventDto.create()`가 호출된 “발송 시각”입니다.
- 도메인 엔티티 생성 시각은 payload 내부 `createdAt`과 별개일 수 있습니다.

예시
- 채팅 메시지 payload의 `createdAt`: 메시지 엔티티 생성 시각
- envelope `timestamp`: 소켓 emit 래핑 시각

## 9. `connection-hook.interface.ts`

역할
- 연결 완료 후 실행할 확장 포인트 계약입니다.

인터페이스
- `onConnect(client, userId, isAdmin): Promise<void>`

관찰
- `WS_CONNECT_HOOK` 심볼도 정의되어 있지만, 현재 검색 기준 실제 사용처는 없습니다.
- 현재 시스템은 DI token 방식이 아니라 `registerHook()` 수동 등록 방식을 사용합니다.

런타임 흐름 분석

## 1. 부트스트랩 흐름

핵심 위치
- [../../src/main.ts](../../src/main.ts)

순서
1. HTTP용 cookie/session/passport 미들웨어 생성
2. `SessionIoAdapter` 생성
3. Redis 설정으로 `connectToRedis()` 호출
4. `app.useWebSocketAdapter(socketAdapter)` 적용
5. 개발 환경에서는 AsyncAPI 문서도 생성

실무 의미
- 이 모듈의 상당 부분은 게이트웨이 파일만 보면 이해가 안 되고, 실제 런타임 조립은 `main.ts`를 함께 봐야 합니다.

## 2. 일반 사용자 연결 흐름

1. `/` 네임스페이스 핸드셰이크 도착
2. throttle → cookie/session/passport → CLS 적용
3. 게이트웨이가 `req.user` 추출
4. 모든 소켓 `global` 룸 가입
5. 인증 사용자면 `user:${id}` 룸 가입 + DB 세션 생성 + connect hooks 실행
6. 비인증 사용자면 `lobby` 룸 가입

의미
- 게스트도 실시간 브로드캐스트 인프라 일부를 수신할 수 있습니다.
- 반면 사용자 개인 알림은 인증 사용자의 개인 룸에만 전달됩니다.

## 3. 관리자 연결 흐름

1. `/admin` 네임스페이스 핸드셰이크 도착
2. throttle → admin session/passport → CLS 적용
3. `req.user.role`이 `ADMIN`/`SUPER_ADMIN`인지 확인
4. 공용 `admin` 룸, 개인 `admin:${id}` 룸 가입
5. DB 관리자 WebSocket 세션 생성
6. connect hooks 실행

의미
- 관리자 대시보드와 사용자 일반 실시간 채널이 네임스페이스 레벨에서 분리됩니다.

## 4. 연결 훅 흐름

현재 훅 등록 모듈
- [../../src/modules/chat/rooms/chat-rooms.module.ts](../../src/modules/chat/rooms/chat-rooms.module.ts)
- [../../src/modules/chat/support/chat-support.module.ts](../../src/modules/chat/support/chat-support.module.ts)

현재 훅 구현
- [../../src/modules/chat/rooms/application/chat-room-membership-hook.service.ts](../../src/modules/chat/rooms/application/chat-room-membership-hook.service.ts)
  - 사용자가 속한 활성 채팅방을 조회해 자동 조인
- [../../src/modules/chat/support/application/support-room-assignment-hook.service.ts](../../src/modules/chat/support/application/support-room-assignment-hook.service.ts)
  - 관리자일 때 담당 중인 활성 상담방을 조회해 자동 조인

의미
- 사용자가 재연결해도 현재 멤버십/배정 상태를 바탕으로 필요한 룸을 다시 복원합니다.

## 5. 서버 푸시 흐름

대표 시나리오 1. 개인 알림
- [../../src/modules/notification/infrastructure/processors/inbox.processor.ts](../../src/modules/notification/infrastructure/processors/inbox.processor.ts)
- BullMQ 워커가 템플릿을 렌더링한 뒤 `sendToUser(receiverId, INBOX_NEW, payload)` 호출
- 결과는 `admin:${id}`와 `user:${id}` 양쪽으로 emit 시도

대표 시나리오 2. 채팅 메시지
- [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
- 메시지 저장 후 room type에 따라 `chat:${id}` 또는 `support:${id}` 룸으로 브로드캐스트

대표 시나리오 3. 관리자 알림
- [../../src/modules/chat/support/application/send-support-message.service.ts](../../src/modules/chat/support/application/send-support-message.service.ts)
- [../../src/modules/deposit/application/create-fiat-deposit.service.ts](../../src/modules/deposit/application/create-fiat-deposit.service.ts)
- `SOCKET_ROOMS.ADMIN`을 대상으로 공용 관리자 룸 브로드캐스트 수행

## 6. 룸 강제 가입 흐름

대표 시나리오
- [../../src/modules/chat/support/application/start-support-inquiry.service.ts](../../src/modules/chat/support/application/start-support-inquiry.service.ts)
- [../../src/modules/chat/support/application/assign-support-inquiry.service.ts](../../src/modules/chat/support/application/assign-support-inquiry.service.ts)

동작
- 도메인 서비스가 DB 상태 변경 후 `joinChatRoom()`을 호출해 현재 연결된 소켓들을 대상 룸에 즉시 참여시킵니다.

실무 의미
- 재연결을 기다리지 않고도 룸 기반 실시간 수신을 활성화하려는 목적입니다.

실제 사용 패턴 정리

## 1. `sendToUser()` 패턴

대표 예시
- [../../src/modules/notification/infrastructure/processors/inbox.processor.ts](../../src/modules/notification/infrastructure/processors/inbox.processor.ts)

특징
- 개인 룸 기반 푸시
- payload는 보통 이미 Sqids 인코딩과 ISO 문자열 변환을 마친 상태로 전달
- 이 레이어는 raw 도메인 객체를 직접 넘기지 않고 프론트 친화적 payload를 생성한 뒤 전송

## 2. `sendToRoom()` 패턴

대표 예시
- [../../src/modules/chat/rooms/application/send-chat-message.service.ts](../../src/modules/chat/rooms/application/send-chat-message.service.ts)
- [../../src/modules/chat/rooms/application/read-chat-messages.service.ts](../../src/modules/chat/rooms/application/read-chat-messages.service.ts)
- [../../src/modules/chat/support/application/send-support-message.service.ts](../../src/modules/chat/support/application/send-support-message.service.ts)

특징
- 같은 룸 이름을 사용자/관리자 네임스페이스에 동시에 emit
- 사용자와 관리자가 같은 지원/채팅 룸 이름을 공유할 수 있다는 전제 위에 설계됨

## 3. `joinChatRoom()` 패턴

대표 예시
- [../../src/modules/chat/support/application/start-support-inquiry.service.ts](../../src/modules/chat/support/application/start-support-inquiry.service.ts)
- [../../src/modules/chat/support/application/assign-support-inquiry.service.ts](../../src/modules/chat/support/application/assign-support-inquiry.service.ts)

특징
- DB 상태를 바꾼 직후, 현재 살아 있는 소켓 세션을 해당 룸에 참여시키는 보조 동작으로 사용됩니다.

## 4. 훅 등록 패턴

대표 예시
- [../../src/modules/chat/rooms/chat-rooms.module.ts](../../src/modules/chat/rooms/chat-rooms.module.ts)
- [../../src/modules/chat/support/chat-support.module.ts](../../src/modules/chat/support/chat-support.module.ts)

특징
- 모듈 초기화 시점에 수동 등록
- DI 다중 provider나 discovery가 아니라, 명시적으로 `registerHook()` 호출

중요 관찰 및 주의사항

## 1. 실제 수신 이벤트 이름과 문서 설명이 어긋나 있다
- 실제 발송 이벤트 이름은 `WebsocketService.EVENT_NAME = 'events'`입니다.
- 그런데 [../../src/main.ts](../../src/main.ts)의 AsyncAPI 설명에는 `socket.on('event', ...)`라고 안내되어 있습니다.
- 게이트웨이의 `@AsyncApiPub` 채널명도 `event`, `admin/event`로 표기되어 있어 실제 Socket.IO `emit()` 이름과 다릅니다.

[주의]
- 현재 코드 기준 클라이언트가 `event`를 리슨하면 메시지를 받지 못할 가능성이 큽니다.
- 실제 프론트 구현이 무엇을 리슨하는지 반드시 교차 확인해야 합니다.

## 2. `joinChatRoom()`은 관리자 네임스페이스를 직접 다루지 않는다
- 구현은 `this.gateway.server.in(getSocketRoom.user(userId)).socketsJoin(roomName)`입니다.
- 즉 `/` 네임스페이스의 `user:${id}` 룸을 가진 소켓만 대상입니다.
- 반면 관리자 연결 시 [../../src/infrastructure/websocket/gateways/admin-websocket.gateway.ts](../../src/infrastructure/websocket/gateways/admin-websocket.gateway.ts)는 `admin:${id}` 룸에만 가입합니다.

코드 기반 해석
- 사용자용 상담방 즉시 가입에는 적합합니다.
- 하지만 [../../src/modules/chat/support/application/assign-support-inquiry.service.ts](../../src/modules/chat/support/application/assign-support-inquiry.service.ts)처럼 관리자에게 호출하는 경우, 현재 `/admin`에 연결된 소켓을 즉시 support 룸에 넣지 못할 수 있습니다.
- 관리자 쪽은 재연결 시 `SupportRoomAssignmentHookService`가 보정해 줄 수 있지만, “배정 직후 즉시 수신” 관점에서는 비대칭입니다.

## 3. `SUPPORT_CHAT_MESSAGES_READ`는 정의되어 있지만 현재 발송되지 않는다
- [../../src/infrastructure/websocket/types/socket-payload.types.ts](../../src/infrastructure/websocket/types/socket-payload.types.ts)에는 `SUPPORT_CHAT_MESSAGES_READ`가 정의되어 있습니다.
- 그러나 [../../src/modules/chat/rooms/application/read-chat-messages.service.ts](../../src/modules/chat/rooms/application/read-chat-messages.service.ts)는 방 타입과 무관하게 `SOCKET_EVENT_TYPES.CHAT_MESSAGES_READ`를 발송합니다.

의미
- 문서/타입 계약상 지원 이벤트와 실제 런타임 이벤트가 어긋납니다.
- 프론트가 support read 이벤트를 별도 타입으로 기대한다면 동작 불일치가 생길 수 있습니다.

## 4. 일부 이벤트 타입/메서드는 현재 실사용이 보이지 않는다

현재 검색 기준 실사용이 확인되지 않은 항목
- `SOCKET_EVENT_TYPES.WITHDRAW_REQUESTED`
- `AdminWebsocketGateway.emitToAdminRoom()`
- `UserWebsocketGateway.emitToAll()`
- `WebsocketService.leaveChatRoom()`
- `WS_CONNECT_HOOK` symbol

의미
- 미래 확장용 API일 수 있고, 구현이 진행 중일 수도 있습니다.
- 반대로 오래된 설계 잔여물일 수도 있으므로 유지 보수 시 실제 필요 여부를 점검하는 편이 좋습니다.

## 5. 전용 테스트가 보이지 않는다
- 현재 검색 기준 `apps/api/src`와 `apps/api/test` 아래에 WebSocket 전용 spec/integration 테스트 파일이 보이지 않습니다.
- 인증 핸드셰이크, Redis adapter, 관리자 권한 차단, connect hook, 룸 조인, 실제 emit 이벤트 이름까지는 자동 검증 범위 밖으로 보입니다.

## 6. Hook 실패는 연결 실패로 이어질 수 있다
- `executeConnectHooks()`는 `Promise.all()` 기반입니다.
- 게이트웨이는 이 호출을 세션 생성과 같은 `try/catch` 안에서 수행합니다.
- 따라서 예외를 삼키지 않는 새 hook를 추가하면, 연결 자체가 끊어질 수 있다는 점을 알아야 합니다.

새 작업 시 체크리스트
1. 새 실시간 기능이 진짜 WebSocket inbound가 필요한지, 아니면 기존처럼 REST + 서버 푸시로 충분한지 먼저 결정
2. 새 이벤트를 추가할 때 `SOCKET_EVENT_TYPES`, payload 인터페이스, `SocketPayloadMap`, AsyncAPI 문서 설명을 함께 갱신
3. 공용 채팅/상담 이벤트인지, 사용자 개인 알림인지, 관리자 전용 알림인지에 따라 `sendToUser()`와 `sendToRoom()`을 구분
4. 룸 네이밍은 반드시 `getSocketRoom.*()`를 사용해 하드코딩 방지
5. 관리자 대상 룸 조작이 필요하면 현재 구현이 `/admin` 네임스페이스도 다루는지 확인
6. envelope `timestamp`와 payload 내부 도메인 `createdAt`가 다른 의미라는 점을 혼동하지 않기
7. 문서와 실제 Socket.IO 이벤트 이름(`events`)이 일치하는지 클라이언트 구현과 함께 검증

변경 시 특히 조심할 점
- `EVENT_NAME` 변경: 프론트 전체 수신 계약이 깨짐
- 룸 이름 규칙 변경: 기존 join/emit/restore 흐름 전체에 영향
- 어댑터 middleware 순서 변경: 인증/세션/CLS 동작에 직접 영향
- 관리자/사용자 네임스페이스 정책 변경: 접근 제어와 수신 범위가 바뀜
- `SocketPayloadMap` 변경: 타입 안정성과 프론트 계약 동시 변경
- hook 실행 방식 변경: 연결 성공/실패 조건이 달라짐

요약 결론
- 이 WebSocket 인프라는 NestJS Gateway 자체보다, `SessionIoAdapter + WebsocketService + room 규약 + 연결 훅` 조합이 본체입니다.
- 핵심 이해 포인트는 세 가지입니다.
  - 인증과 세션 복원은 어댑터에서, 실시간 송신은 `WebsocketService` facade에서 담당한다는 점
  - 실제 사용 방식은 서버 푸시 중심이며, 채팅/알림 도메인이 룸 기반 브로드캐스트를 공통으로 활용한다는 점
  - 현재 코드에는 `events` vs `event` 문서 불일치, 관리자 룸 조인 비대칭, support read 이벤트 타입 미사용 같은 유지보수상 주의 지점이 분명히 존재한다는 점