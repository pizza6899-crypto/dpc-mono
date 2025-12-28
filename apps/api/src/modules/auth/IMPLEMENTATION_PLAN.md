# Auth 모듈 추가 기능 구현 계획

## 📋 개요

현재 auth 모듈에 필요한 추가 기능들을 단계별로 구현하는 계획입니다.
Hexagonal Architecture (Ports & Adapters) 패턴과 Domain-Driven Design (DDD) 원칙을 따릅니다.

---

## 🎯 1단계: 비밀번호 관리 (Password Management)

### 1.1 비밀번호 재설정 (Password Reset)

#### 목표
- 사용자가 비밀번호를 잊었을 때 이메일을 통해 재설정할 수 있는 기능

#### 구현 내용

**1.1.1 데이터베이스 스키마 확인/확장**
- `UserToken` 모델 확인 (이미 존재 ✅)
- `TokenType` enum 확인 필요 (현재 값 확인 후 추가)
- `EmailType` enum에 `PASSWORD_RESET` 이미 존재 ✅

**1.1.2 도메인 레이어**
```
password/
  domain/
    model/
      password-reset-token.entity.ts      # 비밀번호 재설정 토큰 엔티티
    policy.ts                             # 비밀번호 정책 (길이, 복잡도 등)
    exception.ts                          # PasswordResetException 등
```

**1.1.3 애플리케이션 레이어**
```
password/
  application/
    request-password-reset.service.ts     # 비밀번호 재설정 요청 (이메일 발송)
    reset-password.service.ts              # 비밀번호 재설정 (토큰 검증 후 변경)
    change-password.service.ts             # 비밀번호 변경 (로그인한 사용자)
```

**1.1.4 인프라스트럭처 레이어**
```
password/
  infrastructure/
    password-reset-token.repository.ts    # UserToken 기반 토큰 관리
    password-reset-token.mapper.ts
```

**1.1.5 컨트롤러**
```
password/
  controllers/
    user/
      password-user.controller.ts
      dto/
        request/
          request-password-reset.request.dto.ts
          reset-password.request.dto.ts
          change-password.request.dto.ts
        response/
          password-reset-response.dto.ts
```

**1.1.6 API 엔드포인트**
```
POST /auth/password/reset-request
  - 요청: { email: string }
  - 응답: { success: boolean, message: string }
  - Rate limit: 5회/시간 (IP 기준)
  - 이메일 발송 (MailService 사용)

POST /auth/password/reset
  - 요청: { token: string, newPassword: string }
  - 응답: { success: boolean }
  - 토큰 검증 및 비밀번호 변경

POST /auth/password/change
  - 요청: { currentPassword: string, newPassword: string }
  - 응답: { success: boolean }
  - 인증 필요
  - 현재 비밀번호 검증 후 변경
```

**1.1.7 필요한 파일 목록**
- [ ] `apps/api/src/modules/auth/password/domain/model/password-reset-token.entity.ts`
- [ ] `apps/api/src/modules/auth/password/domain/policy.ts`
- [ ] `apps/api/src/modules/auth/password/domain/exception.ts`
- [ ] `apps/api/src/modules/auth/password/application/request-password-reset.service.ts`
- [ ] `apps/api/src/modules/auth/password/application/reset-password.service.ts`
- [ ] `apps/api/src/modules/auth/password/application/change-password.service.ts`
- [ ] `apps/api/src/modules/auth/password/infrastructure/password-reset-token.repository.ts`
- [ ] `apps/api/src/modules/auth/password/infrastructure/password-reset-token.mapper.ts`
- [ ] `apps/api/src/modules/auth/password/ports/out/password-reset-token.repository.port.ts`
- [ ] `apps/api/src/modules/auth/password/controllers/user/password-user.controller.ts`
- [ ] `apps/api/src/modules/auth/password/password.module.ts`
- [ ] 테스트 파일들 (*.spec.ts)

**1.1.8 데이터베이스 마이그레이션**
- `TokenType` enum에 `PASSWORD_RESET` 추가 (없는 경우)
- `EmailType` enum에 `PASSWORD_RESET` 추가 (없는 경우)

---

## 🎯 2단계: 세션 관리 (Session Management)

### 2.1 활성 세션 조회 및 관리

#### 목표
- 사용자가 자신의 모든 활성 세션을 조회하고 관리할 수 있는 기능

#### 구현 내용

**2.1.1 도메인 레이어**
```
session/
  domain/
    model/
      user-session.entity.ts              # UserSession 엔티티 래핑
    policy.ts                             # 세션 정책 (최대 세션 수 등)
```

**2.1.2 애플리케이션 레이어**
```
session/
  application/
    list-user-sessions.service.ts          # 활성 세션 목록 조회
    revoke-session.service.ts              # 특정 세션 종료
    revoke-all-sessions.service.ts         # 모든 세션 종료 (현재 제외)
```

**2.1.3 인프라스트럭처 레이어**
```
session/
  infrastructure/
    user-session.repository.ts             # UserSession 모델 기반
    user-session.mapper.ts
```

**2.1.4 컨트롤러**
```
session/
  controllers/
    user/
      session-user.controller.ts
      dto/
        response/
          user-session.response.dto.ts
```

**2.1.5 API 엔드포인트**
```
GET /auth/sessions
  - 응답: { sessions: UserSession[] }
  - 인증 필요
  - 현재 사용자의 활성 세션만 조회

DELETE /auth/sessions/:sessionId
  - 응답: { success: boolean }
  - 인증 필요
  - 특정 세션 종료 (자신의 세션만)

DELETE /auth/sessions/all
  - 응답: { success: boolean }
  - 인증 필요
  - 모든 세션 종료 (현재 세션 제외)
```

**2.1.6 필요한 파일 목록**
- [ ] `apps/api/src/modules/auth/session/domain/model/user-session.entity.ts`
- [ ] `apps/api/src/modules/auth/session/domain/policy.ts`
- [ ] `apps/api/src/modules/auth/session/application/list-user-sessions.service.ts`
- [ ] `apps/api/src/modules/auth/session/application/revoke-session.service.ts`
- [ ] `apps/api/src/modules/auth/session/application/revoke-all-sessions.service.ts`
- [ ] `apps/api/src/modules/auth/session/infrastructure/user-session.repository.ts`
- [ ] `apps/api/src/modules/auth/session/infrastructure/user-session.mapper.ts`
- [ ] `apps/api/src/modules/auth/session/ports/out/user-session.repository.port.ts`
- [ ] `apps/api/src/modules/auth/session/controllers/user/session-user.controller.ts`
- [ ] `apps/api/src/modules/auth/session/session.module.ts`
- [ ] 테스트 파일들

---

## 🎯 3단계: 계정 관리 (Account Management)

### 3.1 계정 상태 관리

#### 목표
- 사용자와 관리자가 계정 상태를 관리할 수 있는 기능

#### 구현 내용

**3.1.1 애플리케이션 레이어**
```
account/
  application/
    deactivate-account.service.ts         # 사용자가 자신의 계정 비활성화
    unlock-account.service.ts              # 관리자가 계정 잠금 해제 (이미 구현됨?)
    update-account-status.service.ts       # 관리자가 계정 상태 변경
```

**3.1.2 컨트롤러**
```
account/
  controllers/
    user/
      account-user.controller.ts
    admin/
      account-admin.controller.ts
```

**3.1.3 API 엔드포인트**
```
PATCH /auth/account/deactivate
  - 응답: { success: boolean }
  - 인증 필요
  - 사용자가 자신의 계정 비활성화

POST /admin/auth/accounts/:userId/unlock
  - 응답: { success: boolean, deletedCount: number }
  - 관리자 권한 필요
  - 계정 잠금 해제 (LoginAttempt 삭제)

PATCH /admin/auth/accounts/:userId/status
  - 요청: { status: UserStatus }
  - 응답: { success: boolean }
  - 관리자 권한 필요
  - 계정 상태 변경 (ACTIVE/SUSPENDED/CLOSED)
```

**3.1.4 필요한 파일 목록**
- [ ] `apps/api/src/modules/auth/account/application/deactivate-account.service.ts`
- [ ] `apps/api/src/modules/auth/account/application/unlock-account.service.ts` (확인 필요)
- [ ] `apps/api/src/modules/auth/account/application/update-account-status.service.ts`
- [ ] `apps/api/src/modules/auth/account/controllers/user/account-user.controller.ts`
- [ ] `apps/api/src/modules/auth/account/controllers/admin/account-admin.controller.ts`
- [ ] `apps/api/src/modules/auth/account/account.module.ts`
- [ ] 테스트 파일들

---

## 🎯 4단계: 이메일 인증 (Email Verification)

### 4.1 이메일 인증

#### 목표
- 회원가입 후 이메일 인증을 통해 계정을 활성화하는 기능

#### 구현 내용

**4.1.1 도메인 레이어**
```
email-verification/
  domain/
    model/
      email-verification-token.entity.ts  # 이메일 인증 토큰 엔티티
    policy.ts                              # 인증 정책
```

**4.1.2 애플리케이션 레이어**
```
email-verification/
  application/
    request-email-verification.service.ts  # 인증 이메일 재발송
    verify-email.service.ts                # 이메일 인증 토큰 검증
```

**4.1.3 API 엔드포인트**
```
POST /auth/email/verify-request
  - 응답: { success: boolean }
  - 인증 필요 (또는 이메일만)
  - 인증 이메일 재발송

POST /auth/email/verify
  - 요청: { token: string }
  - 응답: { success: boolean }
  - 이메일 인증 토큰 검증
```

**4.1.4 필요한 파일 목록**
- [ ] `apps/api/src/modules/auth/email-verification/domain/model/email-verification-token.entity.ts`
- [ ] `apps/api/src/modules/auth/email-verification/domain/policy.ts`
- [ ] `apps/api/src/modules/auth/email-verification/application/request-email-verification.service.ts`
- [ ] `apps/api/src/modules/auth/email-verification/application/verify-email.service.ts`
- [ ] `apps/api/src/modules/auth/email-verification/infrastructure/email-verification-token.repository.ts`
- [ ] `apps/api/src/modules/auth/email-verification/controllers/user/email-verification-user.controller.ts`
- [ ] `apps/api/src/modules/auth/email-verification/email-verification.module.ts`
- [ ] 테스트 파일들

**4.1.5 데이터베이스 마이그레이션**
- `TokenType` enum에 `EMAIL_VERIFICATION` 추가
- `EmailType` enum에 `EMAIL_VERIFICATION` 추가
- User 모델에 `emailVerifiedAt` 필드 추가 고려

---

## 🎯 5단계: 관리자 전용 기능 (Admin Features)

### 5.1 사용자 관리

#### 목표
- 관리자가 사용자를 조회하고 관리할 수 있는 기능

#### 구현 내용

**5.1.1 애플리케이션 레이어**
```
admin/
  application/
    list-users.service.ts                  # 사용자 목록 조회 (필터링, 페이징)
    get-user-detail.service.ts             # 사용자 상세 정보
    reset-user-password.service.ts        # 관리자가 사용자 비밀번호 초기화
```

**5.1.2 컨트롤러**
```
admin/
  controllers/
    user-management.controller.ts
    dto/
      request/
        list-users-query.dto.ts
      response/
        user-list.response.dto.ts
        user-detail.response.dto.ts
```

**5.1.3 API 엔드포인트**
```
GET /admin/auth/users
  - Query: { page, limit, status, role, email, ... }
  - 응답: { users: User[], total: number, page: number, limit: number }
  - 관리자 권한 필요

GET /admin/auth/users/:userId
  - 응답: { user: UserDetail }
  - 관리자 권한 필요

PATCH /admin/auth/users/:userId/password
  - 요청: { newPassword: string }
  - 응답: { success: boolean }
  - 관리자 권한 필요
  - 사용자 비밀번호 초기화 (이메일 발송)
```

**5.1.4 필요한 파일 목록**
- [ ] `apps/api/src/modules/auth/admin/application/list-users.service.ts`
- [ ] `apps/api/src/modules/auth/admin/application/get-user-detail.service.ts`
- [ ] `apps/api/src/modules/auth/admin/application/reset-user-password.service.ts`
- [ ] `apps/api/src/modules/auth/admin/controllers/user-management.controller.ts`
- [ ] `apps/api/src/modules/auth/admin/admin.module.ts`
- [ ] 테스트 파일들

---

## 📦 모듈 구조 (재검토)

### 권장 모듈 구조 (통합된 구조)

기존 프로젝트 패턴을 보면 모듈을 너무 세분화하지 않고, 관련 기능을 묶어서 관리합니다.
따라서 다음과 같이 통합된 구조를 권장합니다:

```
auth/
  ├── auth.module.ts                      # 루트 모듈
  ├── credential/                          # 인증 관련 모든 기능
  │   ├── credential.module.ts
  │   ├── application/
  │   │   ├── authenticate-credential.service.ts      # 기존: 로그인
  │   │   ├── authenticate-credential-admin.service.ts # 기존: 관리자 로그인
  │   │   ├── login.service.ts                        # 기존: 로그인 후처리
  │   │   ├── logout.service.ts                       # 기존: 로그아웃
  │   │   ├── verify-credential.service.ts           # 기존: 자격 증명 검증
  │   │   ├── record-login-attempt.service.ts        # 기존: 로그인 시도 기록
  │   │   ├── find-login-attempts.service.ts         # 기존: 로그인 시도 조회
  │   │   ├── request-password-reset.service.ts     # 신규: 비밀번호 재설정 요청
  │   │   ├── reset-password.service.ts               # 신규: 비밀번호 재설정
  │   │   ├── change-password.service.ts             # 신규: 비밀번호 변경
  │   │   ├── list-user-sessions.service.ts          # 신규: 세션 목록 조회
  │   │   ├── revoke-session.service.ts              # 신규: 세션 종료
  │   │   └── revoke-all-sessions.service.ts         # 신규: 모든 세션 종료
  │   ├── controllers/
  │   │   ├── user/
  │   │   │   ├── credential-user.controller.ts     # 기존 + 비밀번호, 세션 엔드포인트 추가
  │   │   │   └── dto/
  │   │   └── admin/
  │   │       ├── credential-admin.controller.ts     # 기존 + 관리자 기능 추가
  │   │       └── dto/
  │   ├── domain/
  │   │   ├── model/
  │   │   │   ├── credential-user.entity.ts          # 기존
  │   │   │   ├── login-attempt.entity.ts            # 기존
  │   │   │   ├── password-reset-token.entity.ts     # 신규
  │   │   │   └── user-session.entity.ts             # 신규
  │   │   ├── policy.ts                               # 기존 + 비밀번호 정책 추가
  │   │   └── exception.ts                            # 기존 + 비밀번호 관련 예외 추가
  │   ├── infrastructure/
  │   │   ├── credential-user.repository.ts         # 기존
  │   │   ├── login-attempt.repository.ts            # 기존
  │   │   ├── password-reset-token.repository.ts    # 신규
  │   │   └── user-session.repository.ts              # 신규
  │   └── ports/
  │       └── out/
  │           ├── credential-user.repository.port.ts # 기존
  │           ├── login-attempt.repository.port.ts   # 기존
  │           ├── password-reset-token.repository.port.ts # 신규
  │           └── user-session.repository.port.ts     # 신규
  ├── registration/                        # 회원가입 및 이메일 인증
  │   ├── registration.module.ts
  │   ├── application/
  │   │   ├── register-credential.service.ts         # 기존: 회원가입
  │   │   ├── register-credential-admin.service.ts   # 기존: 관리자 회원가입
  │   │   ├── register-social.service.ts             # 기존: 소셜 회원가입
  │   │   ├── request-email-verification.service.ts  # 신규: 이메일 인증 요청
  │   │   └── verify-email.service.ts                # 신규: 이메일 인증
  │   ├── controllers/
  │   │   ├── user/
  │   │   │   ├── registration.controller.ts        # 기존 + 이메일 인증 엔드포인트 추가
  │   │   │   └── dto/
  │   │   └── admin/
  │   │       └── registration-admin.controller.ts  # 기존
  │   ├── domain/
  │   │   ├── model/
  │   │   │   └── registration-user.entity.ts      # 기존
  │   │   ├── policy.ts                              # 기존
  │   │   └── exception.ts                           # 기존
  │   └── infrastructure/
  │       └── user.repository.ts                     # 기존
  └── account/                             # 계정 관리 (선택적)
      ├── account.module.ts
      ├── application/
      │   ├── deactivate-account.service.ts         # 신규: 계정 비활성화
      │   └── update-account-status.service.ts      # 신규: 계정 상태 변경 (관리자)
      └── controllers/
          ├── user/
          │   └── account-user.controller.ts
          └── admin/
              └── account-admin.controller.ts
```

### 모듈 통합 이유

1. **credential 모듈에 통합**
   - 비밀번호 관리: 로그인과 밀접한 관련 (인증 흐름의 일부)
   - 세션 관리: 로그인 후 세션 관리 (인증 상태 관리)
   - 모두 "인증된 사용자"와 관련된 기능

2. **registration 모듈에 통합**
   - 이메일 인증: 회원가입 프로세스의 일부
   - 회원가입 후 이메일 인증 흐름이 자연스러움

3. **account 모듈 (선택적)**
   - 계정 비활성화, 상태 변경 등은 별도 모듈로 분리 가능
   - 또는 credential 모듈에 통합도 가능 (더 단순한 구조)

### 최종 권장 구조 (균형잡힌 버전)

프로젝트의 다른 모듈 구조(affiliate의 code/referral/commission 분리)를 참고하여,
**명확한 책임 분리**를 유지하면서도 **과도한 세분화는 피하는** 구조를 권장합니다:

```
auth/
  ├── auth.module.ts
  ├── credential/                          # 인증 (로그인/로그아웃)
  │   ├── 로그인/로그아웃
  │   └── 로그인 시도 기록
  ├── password/                            # 비밀번호 관리 (별도 도메인)
  │   ├── 비밀번호 재설정
  │   └── 비밀번호 변경
  ├── session/                             # 세션 관리 (별도 도메인)
  │   ├── 세션 조회
  │   └── 세션 종료
  ├── registration/                        # 회원가입
  │   └── 회원가입
  └── email-verification/                  # 이메일 인증 (별도 도메인)
      ├── 이메일 인증 요청
      └── 이메일 인증
```

**총 5개 모듈**로 구성:
- `credential/` - 인증 (로그인/로그아웃)
- `password/` - 비밀번호 관리 (독립적인 비즈니스 도메인)
- `session/` - 세션 관리 (독립적인 비즈니스 도메인)
- `registration/` - 회원가입
- `email-verification/` - 이메일 인증 (독립적인 비즈니스 도메인)

### 모듈 분리 기준

1. **독립적인 비즈니스 도메인**: 각 모듈이 명확한 책임을 가짐
2. **재사용 가능성**: 다른 모듈에서 독립적으로 사용 가능
3. **변경 영향도**: 한 모듈의 변경이 다른 모듈에 최소한의 영향
4. **테스트 용이성**: 각 모듈을 독립적으로 테스트 가능

### 대안: 3개 모듈 구조 (더 통합된 버전)

만약 5개가 많다면, 다음과 같이 3개로 통합할 수도 있습니다:

```
auth/
  ├── credential/                          # 인증 + 비밀번호 관리
  │   ├── 로그인/로그아웃
  │   └── 비밀번호 관리
  ├── session/                             # 세션 관리 (별도)
  │   └── 세션 조회/종료
  └── registration/                        # 회원가입 + 이메일 인증
      ├── 회원가입
      └── 이메일 인증
```

**권장: 5개 모듈 구조** (명확한 책임 분리)

---

## 🔧 공통 작업

### 1. 데이터베이스 마이그레이션
- [ ] `TokenType` enum 확인 및 필요한 타입 추가
- [ ] `EmailType` enum 확인 및 필요한 타입 추가
- [ ] User 모델에 `emailVerifiedAt` 필드 추가 (선택)

### 2. 공통 유틸리티
- [ ] 토큰 생성 유틸리티 (CUID2 또는 UUID)
- [ ] 이메일 템플릿 관리 (MailService와 연동)

### 3. Rate Limiting
- 모든 Public 엔드포인트에 `@Throttle` 데코레이터 적용
- 비밀번호 재설정 요청: 5회/시간
- 비밀번호 재설정: 10회/시간
- 이메일 인증 요청: 5회/시간

### 4. Activity Log
- 모든 중요한 작업에 Activity Log 기록
- 비밀번호 변경, 계정 비활성화, 세션 종료 등

---

## 📅 구현 일정 (예상)

### Phase 1: 비밀번호 관리 (1-2주)
- 비밀번호 재설정 요청
- 비밀번호 재설정
- 비밀번호 변경

### Phase 2: 세션 관리 (1주)
- 활성 세션 조회
- 세션 종료

### Phase 3: 계정 관리 (1주)
- 계정 비활성화
- 계정 상태 변경 (관리자)

### Phase 4: 이메일 인증 (1-2주)
- 이메일 인증 요청
- 이메일 인증

### Phase 5: 관리자 기능 (1주)
- 사용자 목록 조회
- 사용자 상세 정보
- 비밀번호 초기화

**총 예상 기간: 5-7주**

---

## ✅ 체크리스트

### Phase 1: 비밀번호 관리
- [ ] 데이터베이스 스키마 확인/수정
- [ ] 도메인 엔티티 및 정책 구현
- [ ] Use Case 구현
- [ ] Repository 구현
- [ ] Controller 구현
- [ ] 테스트 코드 작성
- [ ] 문서화

### Phase 2: 세션 관리
- [ ] 도메인 엔티티 구현
- [ ] Use Case 구현
- [ ] Repository 구현
- [ ] Controller 구현
- [ ] 테스트 코드 작성

### Phase 3: 계정 관리
- [ ] Use Case 구현
- [ ] Controller 구현
- [ ] 테스트 코드 작성

### Phase 4: 이메일 인증
- [ ] 데이터베이스 스키마 수정
- [ ] 도메인 엔티티 구현
- [ ] Use Case 구현
- [ ] Repository 구현
- [ ] Controller 구현
- [ ] 이메일 템플릿 작성
- [ ] 테스트 코드 작성

### Phase 5: 관리자 기능
- [ ] Use Case 구현
- [ ] Controller 구현
- [ ] 테스트 코드 작성

---

## 🔒 보안 고려사항

1. **토큰 보안**
   - 토큰은 CUID2 또는 암호화된 토큰 사용
   - 토큰 만료 시간: 비밀번호 재설정 1시간, 이메일 인증 24시간
   - 토큰은 한 번만 사용 가능 (usedAt 필드)

2. **Rate Limiting**
   - 모든 Public 엔드포인트에 적용
   - IP 기반 제한

3. **비밀번호 정책**
   - 최소 길이: 8자
   - 복잡도 요구사항 (대소문자, 숫자, 특수문자)
   - 이전 비밀번호 재사용 방지 (선택)

4. **이메일 보안**
   - 이메일 발송 시 Rate Limiting
   - 이메일 로그 기록 (EmailLog)

5. **세션 보안**
   - 세션 만료 시간 관리
   - 세션 하이재킹 방지 (device fingerprint 등)

---

## 📝 참고사항

1. 기존 코드 스타일과 패턴을 따를 것
2. Hexagonal Architecture 원칙 준수
3. Domain-Driven Design 원칙 준수
4. 모든 Use Case에 `@Transactional()` 적용 (필요한 경우)
5. Activity Log 기록 (중요한 작업)
6. 테스트 코드 작성 필수 (Unit Test + Integration Test)
7. Swagger 문서화

---

## 🚀 시작하기

1. **1단계부터 순차적으로 구현**
2. **각 단계 완료 후 테스트 및 리뷰**
3. **다음 단계로 진행**

각 단계는 독립적으로 구현 가능하지만, 의존성이 있는 경우 순서를 지켜야 합니다.

