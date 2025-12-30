# Session Module 기능 명세서

## 📋 개요

사용자 세션 추적 및 관리를 위한 모듈입니다.
- HTTP 세션 및 WebSocket(Socket.io) 세션 모두 추적
- **다중 로그인 제한 정책 지원** (기본값: 단일 세션만 허용)
- 사용자 및 관리자 세션 관리 기능 제공

---

## 🎯 지원 기능

### 1. 사용자 기능 (User Features)

#### 1.1 자신의 활성 세션 목록 조회
- **목적**: 사용자가 현재 로그인한 모든 디바이스/세션 확인
- **표시 정보**:
  - 세션 ID, 타입 (HTTP/WebSocket)
  - 디바이스 정보 (IP, User Agent, 디바이스명, OS, 브라우저)
  - 생성 시간, 마지막 활동 시간
  - 현재 세션 여부 표시

#### 1.2 특정 세션 종료
- **목적**: 특정 디바이스의 세션을 명시적으로 종료
- **제약**: 자신의 세션만 종료 가능
- **동작**: 
  - DB에서 세션 상태를 REVOKED로 변경
  - Redis 세션 스토어에서 세션 삭제 (HTTP 세션인 경우)
  - WebSocket 연결 종료 (WebSocket 세션인 경우)

#### 1.3 모든 세션 종료 (현재 세션 제외)
- **목적**: 다른 모든 디바이스의 세션을 일괄 종료
- **제약**: 현재 사용 중인 세션은 유지
- **사용 사례**: 보안 이슈 발생 시 다른 디바이스 강제 로그아웃

---

### 2. 관리자 기능 (Admin Features)

#### 2.1 전체 세션 목록 조회
- **목적**: 시스템의 모든 활성 세션 모니터링
- **필터링 옵션**:
  - 사용자 ID/이메일
  - 세션 타입 (HTTP/WebSocket)
  - 세션 상태 (ACTIVE/REVOKED/EXPIRED)
  - IP 주소
  - 디바이스 정보
  - 생성 시간 범위
  - 마지막 활동 시간 범위
- **정렬**: 생성 시간, 마지막 활동 시간, 사용자 ID 등
- **페이징**: 지원

#### 2.2 특정 사용자의 세션 목록 조회
- **목적**: 특정 사용자의 모든 세션 조회
- **필터링**: 세션 타입, 상태 등
- **페이징**: 지원

#### 2.3 특정 세션 종료
- **목적**: 관리자가 특정 세션을 강제 종료
- **동작**: 
  - DB에서 세션 상태를 REVOKED로 변경
  - `revokedBy` 필드에 관리자 ID 기록
  - Redis 세션 스토어에서 세션 삭제
  - WebSocket 연결 종료

#### 2.4 특정 사용자의 모든 세션 종료
- **목적**: 특정 사용자의 모든 세션을 일괄 종료
- **사용 사례**: 계정 보안 이슈, 정책 위반 등

---

### 3. 내부 기능 (Internal Services)

#### 3.1 세션 생성
- **트리거**: 로그인 성공 시
- **호출 위치**: `LoginService`에서 호출
- **동작**:
  - **다중 로그인 정책 확인**: 기존 활성 세션 체크 (디바이스 타입별)
  - **정책에 따라 기존 세션 종료**: 같은 디바이스 타입의 기존 세션 종료
  - **HTTP 세션 생성**: Express session ID 사용
  - **WebSocket 세션 생성**: Socket.io socket ID 사용 (로그인 시 자동 연결)
  - 두 세션 모두 같은 디바이스 정보를 가짐 (isMobile 값 동일)
  - 디바이스 정보 수집 및 저장
  - 만료 시간 설정

#### 3.2 세션 활동 시간 업데이트
- **트리거**: 요청/메시지 처리 시
- **동작**: `lastActiveAt` 필드 갱신
- **최적화**: 일정 시간 간격으로 배치 업데이트 고려

#### 3.3 세션 만료 처리
- **트리거**: 세션 만료 시간 도달 시
- **동작**: 상태를 EXPIRED로 변경
- **실행**: 스케줄러 또는 요청 시점에 체크

#### 3.4 만료된 세션 정리
- **목적**: 오래된 만료/종료 세션 정리
- **실행**: 주기적 스케줄러 작업
- **정책**: 일정 기간(예: 30일) 이상 지난 세션 삭제

---

## 🔌 API 엔드포인트

### 사용자 엔드포인트 (`/auth/sessions`)

#### GET `/auth/sessions`
**자신의 활성 세션 목록 조회**

- **인증**: 필요 (현재 사용자)
- **Rate Limit**: 30회/분
- **Query Parameters**: 없음
- **Response**:
```typescript
{
  sessions: Array<{
    uid: string;
    sessionId: string;
    type: 'HTTP' | 'WEBSOCKET';
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    deviceInfo: {
      ipAddress: string | null;
      userAgent: string | null;
      deviceName: string | null;
      os: string | null;
      browser: string | null;
      isMobile: boolean | null;
    };
    createdAt: string; // ISO 8601
    lastActiveAt: string;
    expiresAt: string;
    isCurrentSession: boolean; // 현재 요청의 세션인지 여부
  }>;
}
```

#### DELETE `/auth/sessions/:sessionId`
**특정 세션 종료**

- **인증**: 필요 (현재 사용자)
- **Rate Limit**: 10회/분
- **Path Parameters**:
  - `sessionId`: 종료할 세션 ID
- **제약**: 자신의 세션만 종료 가능
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### DELETE `/auth/sessions/all`
**모든 세션 종료 (현재 세션 제외)**

- **인증**: 필요 (현재 사용자)
- **Rate Limit**: 5회/분
- **Response**:
```typescript
{
  success: boolean;
  revokedCount: number; // 종료된 세션 수
  message: string;
}
```

---

### 관리자 엔드포인트 (`/admin/auth/sessions`)

#### GET `/admin/auth/sessions`
**전체 세션 목록 조회**

- **인증**: 필요 (ADMIN 또는 SUPER_ADMIN)
- **Rate Limit**: 60회/분
- **Query Parameters**:
  - `page`: number (기본값: 1)
  - `limit`: number (기본값: 20, 최대: 100)
  - `userId`: string (사용자 ID 필터)
  - `email`: string (사용자 이메일 필터)
  - `type`: 'HTTP' | 'WEBSOCKET' (세션 타입 필터)
  - `status`: 'ACTIVE' | 'REVOKED' | 'EXPIRED' (세션 상태 필터)
  - `ipAddress`: string (IP 주소 필터)
  - `deviceFingerprint`: string (디바이스 지문 필터)
  - `startDate`: string (ISO 8601, 생성 시간 시작)
  - `endDate`: string (ISO 8601, 생성 시간 종료)
  - `sortBy`: 'createdAt' | 'lastActiveAt' | 'userId' (기본값: 'createdAt')
  - `sortOrder`: 'asc' | 'desc' (기본값: 'desc')
- **Response**:
```typescript
{
  data: Array<{
    uid: string;
    sessionId: string;
    userId: string;
    userEmail: string | null;
    type: 'HTTP' | 'WEBSOCKET';
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    deviceInfo: {
      ipAddress: string | null;
      userAgent: string | null;
      deviceName: string | null;
      os: string | null;
      browser: string | null;
      isMobile: boolean | null;
    };
    createdAt: string;
    lastActiveAt: string;
    expiresAt: string;
    revokedAt: string | null;
    revokedBy: string | null; // 관리자 ID
  }>;
  page: number;
  limit: number;
  total: number;
}
```

#### GET `/admin/auth/sessions/users/:userId`
**특정 사용자의 세션 목록 조회**

- **인증**: 필요 (ADMIN 또는 SUPER_ADMIN)
- **Rate Limit**: 60회/분
- **Path Parameters**:
  - `userId`: 사용자 ID
- **Query Parameters**: 
  - `page`, `limit`, `type`, `status`, `sortBy`, `sortOrder` (위와 동일)
- **Response**: 위와 동일한 페이징 응답

#### DELETE `/admin/auth/sessions/:sessionId`
**특정 세션 강제 종료**

- **인증**: 필요 (ADMIN 또는 SUPER_ADMIN)
- **Rate Limit**: 30회/분
- **Path Parameters**:
  - `sessionId`: 종료할 세션 ID
- **Response**:
```typescript
{
  success: boolean;
  message: string;
  session: {
    uid: string;
    sessionId: string;
    userId: string;
    revokedAt: string;
  };
}
```

#### DELETE `/admin/auth/sessions/users/:userId/all`
**특정 사용자의 모든 세션 종료**

- **인증**: 필요 (ADMIN 또는 SUPER_ADMIN)
- **Rate Limit**: 10회/분
- **Path Parameters**:
  - `userId`: 사용자 ID
- **Response**:
```typescript
{
  success: boolean;
  revokedCount: number;
  message: string;
}
```

---

## 🏗️ 모듈 구조

```
session/
├── domain/
│   ├── model/
│   │   ├── session-type.enum.ts
│   │   ├── session-status.enum.ts
│   │   ├── device-info.vo.ts
│   │   └── user-session.entity.ts
│   ├── policy.ts                    # 세션 정책 (다중 로그인 제한 등)
│   ├── exception.ts                 # 도메인 예외
│   └── index.ts
│
├── application/
│   ├── create-session.service.ts          # 세션 생성
│   ├── update-session-activity.service.ts # 활동 시간 업데이트
│   ├── revoke-session.service.ts           # 세션 종료
│   ├── revoke-all-user-sessions.service.ts # 사용자 모든 세션 종료
│   ├── list-user-sessions.service.ts      # 사용자 세션 목록 조회
│   ├── list-all-sessions.service.ts       # 관리자: 전체 세션 목록 조회
│   ├── list-user-sessions-admin.service.ts # 관리자: 특정 사용자 세션 조회
│   ├── revoke-session-admin.service.ts    # 관리자: 세션 강제 종료
│   ├── revoke-all-user-sessions-admin.service.ts # 관리자: 사용자 모든 세션 종료
│   └── cleanup-expired-sessions.service.ts # 만료된 세션 정리
│
├── infrastructure/
│   ├── user-session.repository.ts         # UserSession Repository 구현
│   ├── user-session.mapper.ts             # DB ↔ Entity 매핑
│   ├── http-session-tracker.ts            # HTTP 세션 추적 (선택적)
│   └── websocket-session-tracker.ts       # WebSocket 세션 추적 (선택적)
│
├── ports/
│   └── out/
│       ├── user-session.repository.port.ts
│       └── user-session.repository.token.ts
│
├── controllers/
│   ├── user/
│   │   ├── session-user.controller.ts
│   │   └── dto/
│   │       ├── request/
│   │       │   └── (없음 - Query만 사용)
│   │       └── response/
│   │           ├── user-session-list.response.dto.ts
│   │           └── revoke-session.response.dto.ts
│   └── admin/
│       ├── session-admin.controller.ts
│       └── dto/
│           ├── request/
│           │   └── list-sessions-query.dto.ts
│           └── response/
│               ├── session-list.response.dto.ts
│               └── revoke-session-admin.response.dto.ts
│
└── session.module.ts
```

---

## 🔄 통합 포인트

### 1. LoginService 통합
```typescript
// credential/application/login.service.ts
async execute({ user, clientInfo, sessionId, isAdmin }) {
  // ... 기존 로그인 기록 ...
  
  // 디바이스 정보 생성
  const deviceInfo = DeviceInfo.create({
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent,
    deviceFingerprint: clientInfo.fingerprint,
    isMobile: clientInfo.isMobile,
    deviceName: clientInfo.deviceName, // 파싱된 디바이스명
    os: clientInfo.os,
    browser: clientInfo.browser,
  });
  
  // HTTP 세션 생성 (session 모듈)
  await this.sessionService.create({
    userId: user.id,
    sessionId: req.sessionID, // Express session ID
    type: SessionType.HTTP,
    deviceInfo,
    expiresAt: new Date(Date.now() + sessionMaxAge),
  });
  
  // WebSocket 세션 생성 (로그인 시 자동 연결)
  // 클라이언트가 WebSocket 연결을 시도하면 socket ID로 세션 생성
  // 또는 로그인 성공 시점에 WebSocket 연결을 명시적으로 생성할 수도 있음
  
  // CreateSessionService 내부 동작:
  // 1. 기존 활성 세션 조회 (같은 디바이스 타입)
  // 2. SessionPolicy.canCreateNewSession(isMobile) 호출 (검증)
  // 3. SessionPolicy.getSessionsToRevokeForNewLogin(isMobile) 호출
  // 4. 기존 세션 종료 (같은 디바이스 타입의 세션들)
  // 5. 새 세션 생성
}
```

### 2. LogoutService 통합
```typescript
// credential/application/logout.service.ts
async execute({ userId, sessionId, clientInfo, isAdmin }) {
  // ... 기존 로그아웃 기록 ...
  
  // 세션 종료 (session 모듈)
  if (sessionId) {
    await this.revokeSessionService.execute({
      sessionId,
      userId, // 자신의 세션인지 검증
    });
  }
}
```

### 3. SessionSerializer 통합
```typescript
// platform/auth/strategies/session.serializer.ts
async deserializeUser(payload, done, req) {
  // 세션 유효성 검증
  if (req?.sessionID) {
    const session = await this.sessionService.findBySessionId(
      req.sessionID
    );
    
    if (!session || !session.isActive()) {
      return done(null, false);
    }
    
    // 활동 시간 업데이트 (배치 처리 고려)
    await this.sessionService.updateActivity(req.sessionID);
  }
  
  // ... 기존 사용자 조회 로직 ...
}
```

### 4. WebSocket 통합
```typescript
// WebSocket Gateway
@WebSocketGateway()
export class AppGateway {
  async handleConnection(client: Socket) {
    const user = client.handshake.auth?.user;
    if (!user) {
      client.disconnect();
      return;
    }
    
    // 클라이언트 정보 추출 (HTTP 세션과 동일한 디바이스 정보 사용)
    const deviceInfo = DeviceInfo.create({
      ipAddress: client.handshake.address,
      userAgent: client.handshake.headers['user-agent'],
      deviceFingerprint: client.handshake.headers['x-device-id'],
      isMobile: this.parseIsMobile(client.handshake.headers),
      // ... 추가 디바이스 정보 파싱
    });
    
    // WebSocket 세션 생성
    // 로그인 시 HTTP 세션이 이미 생성되어 있으므로,
    // 같은 디바이스 타입의 기존 WebSocket 세션이 있다면 종료
    await this.sessionService.create({
      userId: user.id,
      sessionId: client.id,
      type: SessionType.WEBSOCKET,
      deviceInfo, // HTTP 세션과 동일한 isMobile 값
      expiresAt: new Date(Date.now() + websocketSessionMaxAge),
    });
  }
  
  async handleDisconnect(client: Socket) {
    // WebSocket 세션 종료
    await this.sessionService.revoke({
      sessionId: client.id,
    });
  }
}
```

---

## 📊 데이터 흐름

### 세션 생성 흐름
```
1. 사용자 로그인
   ↓
2. LoginService 실행
   ↓
3. 디바이스 정보 추출 (isMobile 등)
   ↓
4. CreateSessionService 호출 (HTTP 세션)
   ↓
5. SessionPolicy로 기존 활성 세션 체크 (같은 디바이스 타입)
   ↓
6. 정책에 따라 기존 세션 종료 (같은 디바이스 타입의 세션들)
   ↓
7. HTTP UserSession 엔티티 생성 및 DB 저장
   ↓
8. Redis 세션 스토어에 HTTP 세션 저장
   ↓
9. 클라이언트가 WebSocket 연결 시도 (로그인 후 자동)
   ↓
10. CreateSessionService 호출 (WebSocket 세션)
   ↓
11. WebSocket UserSession 엔티티 생성 및 DB 저장
   ↓
12. 같은 디바이스의 HTTP + WebSocket 세션 쌍 완성
```

### 세션 종료 흐름
```
1. 사용자/관리자 세션 종료 요청
   ↓
2. RevokeSessionService 실행
   ↓
3. UserSession.revoke() 호출 (불변성 유지)
   ↓
4. Repository를 통해 DB 업데이트
   ↓
5. Redis 세션 스토어에서 삭제 (HTTP인 경우)
   ↓
6. WebSocket 연결 종료 (WebSocket인 경우)
```

---

## 📜 세션 정책 (Session Policy)

세션 정책은 `SessionPolicy` 클래스에 하드코딩되어 있습니다. 정책 변경이 필요한 경우 코드를 수정해야 합니다.

### 정책 설정

```typescript
// domain/policy.ts
private readonly ALLOW_MULTIPLE_LOGIN = false;  // 다중 로그인 비허용
private readonly MAX_CONCURRENT_SESSIONS = 2;   // 전체 최대 세션 수 (PC 1개 + 모바일 1개)
private readonly MAX_PC_SESSIONS = 1;           // PC 디바이스 최대 세션 수
private readonly MAX_MOBILE_SESSIONS = 1;       // 모바일 디바이스 최대 세션 수
```

**참고**: 로그인 시 HTTP 세션과 WebSocket 세션이 함께 생성되므로, 실제로는 각 디바이스당 2개의 세션이 생성됩니다.

### 정책 시나리오

#### 시나리오 1: 단일 디바이스만 허용 (기본값)
```typescript
ALLOW_MULTIPLE_LOGIN = false
MAX_CONCURRENT_SESSIONS = 2
MAX_PC_SESSIONS = 1
MAX_MOBILE_SESSIONS = 1
```
- 한 계정으로 여러 디바이스에서 동시 로그인 불가
- 새 로그인 시 기존 모든 세션 자동 종료
- **참고**: 로그인 시 HTTP + WebSocket 세션이 함께 생성되므로 실제로는 2개 세션 생성

#### 시나리오 2: PC 1개, 모바일 1개 허용
```typescript
ALLOW_MULTIPLE_LOGIN = true
MAX_CONCURRENT_SESSIONS = 4
MAX_PC_SESSIONS = 1
MAX_MOBILE_SESSIONS = 1
```
- PC에서 1개 디바이스 로그인 가능 (HTTP + WebSocket = 2개 세션)
- 모바일에서 1개 디바이스 로그인 가능 (HTTP + WebSocket = 2개 세션)
- 총 최대 4개 세션 (PC 2개 + 모바일 2개)
- PC에서 2번째 로그인 시 기존 PC 세션 종료
- 모바일에서 2번째 로그인 시 기존 모바일 세션 종료

#### 시나리오 3: PC 여러 개, 모바일 1개
```typescript
ALLOW_MULTIPLE_LOGIN = true
MAX_CONCURRENT_SESSIONS = 6
MAX_PC_SESSIONS = 2
MAX_MOBILE_SESSIONS = 1
```
- PC에서 최대 2개 디바이스 로그인 가능 (각각 HTTP + WebSocket = 총 4개 세션)
- 모바일에서 최대 1개 디바이스 로그인 가능 (HTTP + WebSocket = 2개 세션)
- 총 최대 6개 세션

#### 동작 방식

1. **로그인 시 세션 생성**:
   - 사용자가 로그인하면 **HTTP 세션과 WebSocket 세션이 함께 생성**됨
   - 두 세션 모두 같은 디바이스 정보를 가짐 (isMobile 값 동일)

2. **단일 디바이스 정책** (`SESSION_ALLOW_MULTIPLE_LOGIN=false`):
   - 새 로그인 시 기존 모든 활성 세션 자동 종료
   - 항상 1개 디바이스만 유지 (HTTP + WebSocket = 2개 세션)

3. **다중 로그인 허용** (`SESSION_ALLOW_MULTIPLE_LOGIN=true`):
   - **디바이스 타입별 제한 확인**: 같은 디바이스 타입(PC/모바일)의 세션이 최대치에 도달하면 오래된 세션 종료
   - **전체 제한 확인**: 전체 세션 수가 최대치에 도달하면 오래된 세션 종료
   - 두 제한 중 더 엄격한 제한이 적용됨

4. **디바이스 타입별 제한 우선순위**:
   - 먼저 디바이스 타입별 제한 확인 (PC/모바일 각각)
   - 그 다음 전체 세션 수 제한 확인
   - 둘 중 하나라도 초과하면 오래된 세션부터 종료
   - **같은 디바이스의 HTTP + WebSocket 세션은 함께 관리됨**

#### 예외 처리

- `MultipleLoginNotAllowedException`: 다중 로그인이 허용되지 않을 때 발생
- 기존 세션이 있는 경우, 정책에 따라 자동으로 종료되므로 예외가 발생하지 않음
- 예외는 정책 검증 실패 시에만 발생 (예: 최대 세션 수 초과)

---

## 🔒 보안 고려사항

1. **권한 검증**
   - 사용자는 자신의 세션만 조회/종료 가능
   - 관리자는 모든 세션 조회/종료 가능
   - 세션 종료 시 소유자 검증 필수

2. **Rate Limiting**
   - 세션 조회: 30-60회/분
   - 세션 종료: 5-30회/분
   - 관리자 기능은 더 높은 제한

3. **감사 로그**
   - 세션 종료 시 Audit Log 기록
   - 관리자가 종료한 경우 `revokedBy` 필드 기록

4. **세션 하이재킹 방지**
   - 디바이스 지문 추적
   - IP 주소 변경 감지 (선택적)
   - 의심스러운 활동 시 세션 종료

---

## 📝 구현 우선순위

### Phase 1: 핵심 기능 (필수)
1. ✅ Domain 엔티티 설계 (완료)
2. ✅ Prisma 스키마 설계 (완료)
3. ✅ Domain Policy 및 Exception 설계 (완료)
4. Repository 구현
5. CreateSessionService 구현 (정책 통합)
6. RevokeSessionService 구현
7. ListUserSessionsService 구현
8. User Controller 구현

### Phase 2: 관리자 기능
8. ListAllSessionsService 구현
9. RevokeSessionAdminService 구현
10. Admin Controller 구현

### Phase 3: 통합 및 최적화
11. LoginService 통합
12. LogoutService 통합
13. SessionSerializer 통합
14. WebSocket 통합
15. 활동 시간 업데이트 최적화

### Phase 4: 고급 기능
16. 만료된 세션 정리 스케줄러
17. 세션 통계 및 모니터링
18. 의심스러운 활동 감지

---

## 🧪 테스트 전략

1. **Unit Tests**
   - 엔티티 비즈니스 로직
   - 서비스 로직
   - Repository 로직

2. **Integration Tests**
   - 세션 생성/종료 플로우
   - 권한 검증
   - Redis 연동

3. **E2E Tests**
   - API 엔드포인트
   - 사용자 시나리오
   - 관리자 시나리오

