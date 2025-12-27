# Credential 모듈 설계 문서

## 개요

Credential 모듈은 사용자의 자격 증명(ID/PW)을 검증하고 로그인/로그아웃 로직을 담당하는 하위 도메인 모듈입니다.

## 모듈 책임

- 사용자 자격 증명 검증 (ID/PW)
- 로그인/로그아웃 Use Case 처리
- 로그인 시도 기록 (보안 및 감사 목적)
- User/Admin별 인증 컨트롤러 제공

## 디렉토리 구조

```
credential/
├── domain/                          # 도메인 레이어
│   ├── model/
│   │   └── login-attempt.entity.ts  # LoginAttempt 엔티티
│   ├── credential.exception.ts      # 도메인 예외
│   └── index.ts                     # Public API
│
├── application/                     # 애플리케이션 레이어 (Use Cases)
│   ├── record-login-attempt.service.ts
│   ├── find-login-attempts.service.ts
│   └── find-login-attempt-by-id.service.ts
│
├── controllers/                     # HTTP 컨트롤러
│   ├── user/
│   │   └── credential-user.controller.ts
│   └── admin/
│       └── credential-admin.controller.ts
│
├── infrastructure/                  # 인프라 레이어
│   ├── repository/
│   │   └── login-attempt.repository.ts
│   └── mapper/
│       └── login-attempt.mapper.ts
│
├── ports/                           # 포트 정의
│   ├── login-attempt.repository.port.ts
│   └── login-attempt.repository.token.ts
│
└── credential.module.ts             # NestJS 모듈
```

## 도메인 모델

### LoginAttempt 엔티티

로그인 시도 기록을 위한 도메인 엔티티입니다.

**주요 속성:**
- `id: bigint | null` - 내부 관리용 (DB 저장 시 자동 생성)
- `uid: string | null` - 비즈니스용 (CUID2, DB 저장 시 자동 생성)
- `userId: string | null` - 성공한 경우 사용자 ID, 실패한 경우 null
- `result: LoginAttemptResult` - SUCCESS 또는 FAILED
- `failureReason: LoginFailureReason | null` - 실패한 경우에만 값 존재
- `ipAddress: string | null` - IP 주소
- `userAgent: string | null` - User Agent
- `deviceFingerprint: string | null` - 디바이스 지문
- `isMobile: boolean | null` - 모바일 여부
- `attemptedAt: Date` - 시도 시간
- `email: string | null` - 시도한 이메일 (보안 목적)
- `isAdmin: boolean` - 관리자 로그인 시도 여부

**팩토리 메서드:**
- `createSuccess()` - 성공한 로그인 시도 생성
- `createFailure()` - 실패한 로그인 시도 생성
- `fromPersistence()` - DB 데이터로부터 엔티티 생성

**비즈니스 로직 메서드:**
- `isSuccess()` - 로그인 시도가 성공했는지 확인
- `isFailure()` - 로그인 시도가 실패했는지 확인
- `hasFailureReason()` - 특정 실패 이유로 실패했는지 확인

### LoginAttemptResult Enum

```typescript
enum LoginAttemptResult {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
```

### LoginFailureReason Enum

```typescript
enum LoginFailureReason {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_CLOSED = 'ACCOUNT_CLOSED',
  THROTTLE_LIMIT_EXCEEDED = 'THROTTLE_LIMIT_EXCEEDED',
  UNKNOWN = 'UNKNOWN',
}
```

## Application 레이어 (Use Cases)

### 1. RecordLoginAttemptService

**책임**: 로그인 시도 기록 생성 및 저장

**의존성:**
- `LoginAttemptRepositoryPort`
- `IdUtil` (generateUid)

**파라미터:**
```typescript
interface RecordLoginAttemptParams {
  userId?: string | null;           // 성공한 경우 사용자 ID
  result: LoginAttemptResult;
  failureReason?: LoginFailureReason | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  isMobile?: boolean | null;
  email?: string | null;
  isAdmin?: boolean;
  attemptedAt?: Date;
}
```

**반환**: `LoginAttempt`

**비즈니스 로직:**
1. `IdUtil.generateUid()`로 uid 생성
2. `LoginAttempt.createSuccess()` 또는 `LoginAttempt.createFailure()`로 엔티티 생성
3. Repository를 통해 저장
4. 저장된 엔티티 반환

**트랜잭션**: 선택적 (단일 저장 작업)

### 2. FindLoginAttemptsService

**책임**: 로그인 시도 목록 조회 (필터링, 페이지네이션)

**의존성:**
- `LoginAttemptRepositoryPort`

**파라미터:**
```typescript
interface FindLoginAttemptsParams {
  userId?: string;                  // 특정 사용자의 시도만 조회
  result?: LoginAttemptResult;      // 성공/실패 필터
  failureReason?: LoginFailureReason;
  isAdmin?: boolean;                 // 관리자 시도만 조회
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;                // 특정 IP의 시도만 조회
  limit?: number;
  offset?: number;
}
```

**반환**: `LoginAttempt[]`

**비즈니스 로직:**
1. 파라미터에 따라 필터 조건 구성
2. Repository를 통해 조회
3. 결과 반환

### 3. FindLoginAttemptByIdService

**책임**: 로그인 시도 UID 또는 ID로 조회

**의존성:**
- `LoginAttemptRepositoryPort`

**파라미터:**
```typescript
interface FindLoginAttemptByIdParams {
  uid?: string;    // 비즈니스용 (기본)
  id?: bigint;     // 어드민용
}
```

**반환**: `LoginAttempt | null`

**비즈니스 로직:**
1. uid가 있으면 `findByUid()` 호출
2. id가 있으면 `findById()` 호출 (어드민 전용)
3. 결과 반환

## Controllers (라우팅)

### User Controller (`/auth`)

#### POST /auth/login

**책임**: 일반 사용자 로그인

**Guard**: `LocalAuthGuard`

**Request Body**: `LoginDto`
```typescript
{
  email: string;
  password: string;
}
```

**Response**: `LoginResponseDto`
```typescript
{
  user: {
    id: string;
    email: string;
  }
}
```

**비즈니스 로직:**
1. Passport Local Strategy가 자격 증명 검증
2. 검증 성공 시 세션 생성 (Passport 자동 처리)
3. `RecordLoginAttemptService`로 성공 기록 저장
4. ActivityLog에 로그인 성공 기록
5. 사용자 정보 반환

**Throttle**: IP 기반, 15분에 5회 제한

#### POST /auth/logout

**책임**: 일반 사용자 로그아웃

**Guard**: `SessionAuthGuard` (인증 필요)

**Response**: `void` (200 OK)

**비즈니스 로직:**
1. `req.logout()` 호출하여 Passport 세션 제거
2. `req.session.destroy()` 호출하여 세션 완전 삭제
3. ActivityLog에 로그아웃 기록

**Throttle**: IP 기반, 1분에 10회 제한

### Admin Controller (`/admin/auth`)

#### POST /admin/auth/login

**책임**: 관리자 로그인

**Guard**: `AdminLocalAuthGuard`

**Request Body**: `AdminLoginDto`
```typescript
{
  email: string;
  password: string;
}
```

**Response**: `LoginResponseDto`

**비즈니스 로직:**
1. Passport Admin Local Strategy가 자격 증명 검증 (ADMIN/SUPER_ADMIN 역할 확인)
2. 검증 성공 시 관리자 세션 생성
3. `RecordLoginAttemptService`로 성공 기록 저장 (isAdmin: true)
4. ActivityLog에 관리자 로그인 성공 기록
5. 사용자 정보 반환

**Throttle**: IP 기반, 15분에 5회 제한

#### POST /admin/auth/logout

**책임**: 관리자 로그아웃

**Guard**: `SessionAuthGuard` (인증 필요)

**Response**: `void` (200 OK)

**비즈니스 로직:**
1. `req.logout()` 호출하여 Passport 세션 제거
2. `req.session.destroy()` 호출하여 세션 완전 삭제
3. ActivityLog에 관리자 로그아웃 기록

**Throttle**: IP 기반, 1분에 10회 제한

#### GET /admin/auth/login-attempts

**책임**: 로그인 시도 기록 조회 (보안/감사 목적)

**Guard**: `SessionAuthGuard` + `AdminRoleGuard` (ADMIN/SUPER_ADMIN만)

**Query Parameters**:
```typescript
{
  userId?: string;
  result?: 'SUCCESS' | 'FAILED';
  failureReason?: LoginFailureReason;
  isAdmin?: boolean;
  startDate?: string;  // ISO 8601
  endDate?: string;    // ISO 8601
  ipAddress?: string;
  limit?: number;      // 기본값: 50
  offset?: number;     // 기본값: 0
}
```

**Response**: `LoginAttemptListResponseDto`
```typescript
{
  attempts: LoginAttemptResponseDto[];
  total: number;
  limit: number;
  offset: number;
}
```

**비즈니스 로직:**
1. `FindLoginAttemptsService`로 조회
2. 결과를 DTO로 변환하여 반환
3. id와 uid 모두 포함 (운영 편의)

**Throttle**: IP 기반, 1분에 30회 제한

#### GET /admin/auth/login-attempts/:uid

**책임**: 특정 로그인 시도 기록 조회

**Guard**: `SessionAuthGuard` + `AdminRoleGuard`

**Path Parameters**:
- `uid: string` - 로그인 시도 UID

**Response**: `LoginAttemptResponseDto`

**비즈니스 로직:**
1. `FindLoginAttemptByIdService`로 조회
2. 결과를 DTO로 변환하여 반환
3. id와 uid 모두 포함

## Infrastructure 레이어

### LoginAttemptRepository

**책임**: LoginAttempt 엔티티의 영속화 담당

**구현:**
- Prisma를 사용한 PostgreSQL 저장
- `@InjectTransaction()` 데코레이터 사용
- Mapper를 통한 Domain ↔ Prisma 변환

**주요 메서드:**
- `create(attempt: LoginAttempt): Promise<LoginAttempt>`
- `findByUid(uid: string): Promise<LoginAttempt | null>`
- `getByUid(uid: string): Promise<LoginAttempt>`
- `findById(id: bigint): Promise<LoginAttempt | null>` (어드민 전용)
- `getById(id: bigint): Promise<LoginAttempt>` (어드민 전용)
- `listByUserId(userId: string, options?: ListOptions): Promise<LoginAttempt[]>`
- `listByFilters(filters: LoginAttemptFilters, options?: ListOptions): Promise<LoginAttempt[]>`
- `countByFilters(filters: LoginAttemptFilters): Promise<number>`

### LoginAttemptMapper

**책임**: Domain Entity ↔ Prisma Model 변환

**주요 메서드:**
- `toDomain(prismaModel: PrismaLoginAttempt): LoginAttempt`
- `toPrisma(domain: LoginAttempt): PrismaLoginAttemptCreateInput`

## Ports (Outbound)

### LoginAttemptRepositoryPort

**인터페이스 정의:**
```typescript
export interface LoginAttemptRepositoryPort {
  create(attempt: LoginAttempt): Promise<LoginAttempt>;
  findByUid(uid: string): Promise<LoginAttempt | null>;
  getByUid(uid: string): Promise<LoginAttempt>;
  findById(id: bigint): Promise<LoginAttempt | null>;
  getById(id: bigint): Promise<LoginAttempt>;
  listByUserId(userId: string, options?: ListOptions): Promise<LoginAttempt[]>;
  listByFilters(filters: LoginAttemptFilters, options?: ListOptions): Promise<LoginAttempt[]>;
  countByFilters(filters: LoginAttemptFilters): Promise<number>;
}
```

**Token:**
```typescript
export const LOGIN_ATTEMPT_REPOSITORY = Symbol('LOGIN_ATTEMPT_REPOSITORY');
```

## 의존성 방향

```
Controllers → Application Services (Use Cases)
                      ↓
              Domain (LoginAttempt 엔티티)
                      ↓
Infrastructure → Outbound Ports (LoginAttemptRepositoryPort)
```

**핵심 원칙:**
1. **Domain은 의존 없음**: 가장 안쪽 레이어, 외부에 의존하지 않음
2. **Application은 Domain과 Outbound Ports에만 의존**: 구현체가 아닌 인터페이스에 의존
3. **Infrastructure는 Outbound Ports 구현**: Application이 정의한 인터페이스 구현
4. **Controllers는 Application Service에 직접 의존**: 경량 헥사고날에서는 Inbound Port 생략

## Passport Strategy 통합

Credential 모듈은 Passport Strategy를 통해 자격 증명 검증을 수행합니다.

**현재 구조:**
- `LocalStrategy` - 일반 사용자 로컬 인증 (platform/auth/strategies)
- `AdminLocalStrategy` - 관리자 로컬 인증 (platform/auth/strategies)

**참고:**
- Passport Strategy는 `platform/auth/strategies`에 위치
- Credential 모듈의 Infrastructure 레이어에서 Strategy를 참조하거나 재구성 가능
- Strategy는 Application 레이어의 Use Case를 호출하여 유저 검증 수행

## 보안 고려사항

1. **로그인 시도 제한**: Throttle을 통한 IP 기반 제한
2. **실패 기록**: 모든 로그인 시도(성공/실패) 기록
3. **IP 추적**: 의심스러운 로그인 시도 추적
4. **디바이스 지문**: 동일 디바이스에서의 반복 시도 감지
5. **관리자 전용 조회**: 로그인 시도 기록은 관리자만 조회 가능

## 데이터베이스 스키마 (예상)

```prisma
model LoginAttempt {
  id                BigInt              @id @default(autoincrement())
  uid               String              @unique @default(cuid())
  userId            String?
  result            String              // 'SUCCESS' | 'FAILED'
  failureReason     String?
  ipAddress         String?
  userAgent         String?
  deviceFingerprint String?
  isMobile          Boolean?
  attemptedAt       DateTime            @default(now())
  email             String?
  isAdmin           Boolean             @default(false)

  @@index([userId, attemptedAt])
  @@index([result, attemptedAt])
  @@index([ipAddress, attemptedAt])
  @@index([isAdmin, attemptedAt])
  @@index([attemptedAt])
}
```

## 테스트 전략

### 단위 테스트
- Domain 엔티티: `login-attempt.entity.spec.ts`
- Application Services: 각 서비스별 `*.spec.ts`
- Domain 예외: `credential.exception.spec.ts`

### 통합 테스트
- Infrastructure Repository: `login-attempt.repository.integration.spec.ts`
- Mapper: `login-attempt.mapper.integration.spec.ts`

### E2E 테스트
- Controllers: `credential.e2e-spec.ts`

## 구현 우선순위

1. **Phase 1**: 기본 구조
   - Domain 엔티티 ✅ (완료)
   - Ports 정의
   - Infrastructure Repository & Mapper
   - RecordLoginAttemptService

2. **Phase 2**: 조회 기능
   - FindLoginAttemptsService
   - FindLoginAttemptByIdService

3. **Phase 3**: Controllers
   - User Controller (로그인/로그아웃)
   - Admin Controller (로그인/로그아웃/조회)

4. **Phase 4**: 통합 및 테스트
   - Passport Strategy 통합
   - ActivityLog 통합
   - 테스트 작성

