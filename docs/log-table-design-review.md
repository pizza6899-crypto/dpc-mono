# 로그 테이블 설계 검토 및 개선 제안

## 현재 설계 분석

### 발견된 문제점

#### 1. **타입 불일치 (심각)**
- `User.id`는 `BigInt` 타입
- 새로운 로그 테이블들의 `userId`는 `String? @db.Uuid`
- 기존 테이블들(`EmailLog`, `LoginAttempt` 등)은 모두 `BigInt` 사용
- **결과**: Foreign Key 관계 불가, 조인 성능 저하

#### 2. **인덱스 부족 (성능 이슈)**
- `AuthAuditLog`: `userId` 인덱스 없음 (보안 로그 조회 시 필수)
- `UserActivityLog`: `userId` 인덱스 없음 (CS 대응 시 필수)
- `SystemErrorLog`: `path`, `errorCode` 인덱스 없음 (디버깅 시 필요)
- `IntegrationLog`: `provider`, `statusCode` 인덱스 없음

#### 3. **Primary Key 설계 불일치**
- `AuthAuditLog`: 단일 `id` (UUID)
- `UserActivityLog`: 복합키 `[id, createdAt]` (파티셔닝 고려)
- `SystemErrorLog`: 단일 `id` (UUID)
- `IntegrationLog`: 복합키 `[id, createdAt]`
- **문제**: 파티셔닝을 고려한다면 일관성 필요

#### 4. **필수 필드 누락**
- `SystemErrorLog`: `userId` 필드 없음 (사용자별 에러 추적 불가)
- `IntegrationLog`: `userId` 필드 없음 (사용자별 API 호출 추적 불가)
- `AuthAuditLog`: `userAgent`, `deviceFingerprint` 등 보안 추적 필드 부족

#### 5. **파티셔닝 고려 부족**
- `UserActivityLog`는 파티셔닝 대상이라고 명시했지만, 실제 파티셔닝 키가 명확하지 않음
- PostgreSQL 파티셔닝을 위해서는 `createdAt`이 PK에 포함되어야 함

## 개선된 설계 제안

### 1. AuthAuditLog (보안/인증 로그)

```prisma
model AuthAuditLog {
  id               String   @id @default(uuid())
  createdAt        DateTime @default(now())
  userId           BigInt?  // User.id와 타입 일치
  action           String   // LOGIN, PASSWORD_CHANGE, LOGOUT
  status           String   // SUCCESS, FAILURE
  ip               String?
  userAgent        String?  // 보안 추적용
  deviceFingerprint String? // 보안 추적용
  metadata         Json?    // 구체적인 변경 이력 (before/after 등)
  
  // Foreign Key (선택적 - 보안 로그는 사용자 삭제 후에도 보관)
  user             User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("auth_audit_logs")
  @@index([userId, createdAt]) // 사용자별 조회 최적화
  @@index([action, createdAt]) // 액션별 조회
  @@index([ip, createdAt])     // IP 추적
  @@index([createdAt])         // 시간 범위 조회
}
```

**개선 사항:**
- ✅ `userId`를 `BigInt?`로 변경 (User.id와 일치)
- ✅ `userAgent`, `deviceFingerprint` 추가 (보안 추적)
- ✅ Foreign Key 관계 추가
- ✅ 복합 인덱스 추가 (조회 패턴 최적화)

### 2. UserActivityLog (서비스 활동 로그)

```prisma
model UserActivityLog {
  id        String   @default(uuid())
  createdAt DateTime @default(now())
  userId    BigInt?  // User.id와 타입 일치
  category  String   // WALLET, CODE_GEN, BOARD
  action    String   // CREATE_CODE, UPDATE_PROFILE
  metadata  Json?    // CS 대응에 필요한 구체 정보
  
  // Foreign Key
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  // 파티셔닝을 위한 복합 PK (createdAt 포함)
  @@id([id, createdAt])
  @@map("user_activity_logs")
  
  // CS 대응을 위한 최적화된 인덱스
  @@index([userId, createdAt(sort: Desc)]) // 사용자별 최신 활동 조회
  @@index([userId, category, createdAt(sort: Desc)]) // 카테고리별 조회
  @@index([category, action, createdAt(sort: Desc)]) // 액션별 조회
  @@index([createdAt(sort: Desc)]) // 전체 최신 활동 조회
}
```

**개선 사항:**
- ✅ `userId`를 `BigInt?`로 변경
- ✅ Foreign Key 관계 추가
- ✅ 복합 인덱스 추가 (CS 대응 최적화)
- ✅ 파티셔닝을 위한 복합 PK 유지

### 3. SystemErrorLog (기술적 문제 로그)

```prisma
model SystemErrorLog {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())
  userId       BigInt?  // 에러 발생 사용자 (선택적)
  errorCode    String?  // 예: INTERNAL_SERVER_ERROR
  errorMessage String   // 에러 메시지 요약
  stackTrace   String?  @db.Text // 긴 에러 스택
  path         String?  // 에러 발생 API 경로
  method       String?  // HTTP 메서드
  statusCode   Int?     // HTTP 상태 코드
  severity     String?  // ERROR, WARN, CRITICAL
  resolved     Boolean  @default(false) // 해결 여부
  resolvedAt   DateTime?
  
  // Foreign Key (선택적)
  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("system_error_logs")
  @@index([createdAt]) // TTL 정리용
  @@index([errorCode, createdAt]) // 에러 타입별 조회
  @@index([path, createdAt]) // 경로별 조회
  @@index([severity, createdAt]) // 심각도별 조회
  @@index([resolved, createdAt]) // 미해결 에러 조회
  @@index([userId, createdAt]) // 사용자별 에러 조회
}
```

**개선 사항:**
- ✅ `userId` 필드 추가
- ✅ `method`, `statusCode`, `severity`, `resolved` 필드 추가
- ✅ Foreign Key 관계 추가
- ✅ 디버깅을 위한 인덱스 추가

### 4. IntegrationLog (외부 서비스 연동 기록)

```prisma
model IntegrationLog {
  id           String   @default(uuid())
  createdAt    DateTime @default(now())
  userId       BigInt?  // API 호출한 사용자 (선택적)
  provider     String   // TOSS, ALIGO, TELEGRAM, WHITECLIFF, DCS
  method       String   // POST, GET, PUT, DELETE
  endpoint     String
  statusCode   Int?
  requestBody  Json?    // 마스킹된 요청값
  responseBody Json?    // 상대방 응답값
  duration     Int      // ms (지연 시간 체크)
  success      Boolean  // 성공/실패 여부
  errorMessage String?  // 실패 시 에러 메시지
  
  // Foreign Key (선택적)
  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  // 파티셔닝을 위한 복합 PK
  @@id([id, createdAt])
  @@map("integration_logs")
  
  @@index([provider, createdAt]) // 프로바이더별 조회
  @@index([provider, statusCode, createdAt]) // 프로바이더별 상태 조회
  @@index([userId, createdAt]) // 사용자별 API 호출 조회
  @@index([success, createdAt]) // 성공/실패별 조회
  @@index([createdAt]) // 시간 범위 조회
}
```

**개선 사항:**
- ✅ `userId` 필드 추가
- ✅ `success`, `errorMessage` 필드 추가
- ✅ Foreign Key 관계 추가
- ✅ 모니터링을 위한 인덱스 추가

## User 모델에 Relation 추가

```prisma
model User {
  // ... 기존 필드들 ...
  
  // 새로운 로그 관계 추가
  authAuditLogs    AuthAuditLog[]
  userActivityLogs UserActivityLog[]
  systemErrorLogs  SystemErrorLog[]
  integrationLogs  IntegrationLog[]
}
```

## 추가 고려사항

### 1. 파티셔닝 전략

PostgreSQL 파티셔닝을 위해서는:

```sql
-- UserActivityLog 파티셔닝 예시
CREATE TABLE user_activity_logs (
  id VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL,
  -- ... 기타 필드
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
CREATE TABLE user_activity_logs_2025_01 
  PARTITION OF user_activity_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 2. TTL 정리 전략

```sql
-- SystemErrorLog 자동 정리 (30일 후)
DELETE FROM system_error_logs 
WHERE created_at < NOW() - INTERVAL '30 days'
  AND resolved = true;
```

### 3. 데이터 마이그레이션

기존 `ActivityLog`에서 새로운 구조로 마이그레이션 시:
- 보안 관련 → `AuthAuditLog`
- 서비스 이용 → `UserActivityLog`
- 기존 데이터는 단계적으로 마이그레이션

## 최종 평가

### 현재 설계: ⚠️ 개선 필요

**문제점:**
1. ❌ 타입 불일치 (BigInt vs UUID)
2. ❌ 인덱스 부족
3. ❌ Foreign Key 관계 없음
4. ❌ 필수 필드 누락

**개선 후:**
1. ✅ 타입 일관성
2. ✅ 최적화된 인덱스
3. ✅ Foreign Key 관계
4. ✅ 완전한 필드 구성

