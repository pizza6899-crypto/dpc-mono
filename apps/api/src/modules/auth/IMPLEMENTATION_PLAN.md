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

## 🔍 로그인 보안 검토

### 요약
- 대상 파일: [apps/api/src/modules/auth/credential/controllers/user/user-auth.controller.ts](apps/api/src/modules/auth/credential/controllers/user/user-auth.controller.ts), [apps/api/src/modules/auth/credential/controllers/admin/admin-auth.controller.ts](apps/api/src/modules/auth/credential/controllers/admin/admin-auth.controller.ts), [apps/api/src/modules/auth/credential/application/authenticate-identity.service.ts](apps/api/src/modules/auth/credential/application/authenticate-identity.service.ts), [apps/api/src/modules/auth/credential/application/verify-credential.service.ts](apps/api/src/modules/auth/credential/application/verify-credential.service.ts), [apps/api/src/modules/auth/credential/application/login.service.ts](apps/api/src/modules/auth/credential/application/login.service.ts), [apps/api/src/modules/auth/session/application/create-session.service.ts](apps/api/src/modules/auth/session/application/create-session.service.ts), [apps/api/src/common/auth/strategies/session.serializer.ts](apps/api/src/common/auth/strategies/session.serializer.ts)
- 핵심 흐름: 컨트롤러 → AuthenticateIdentityService → req.login(req.session) → LoginService → CreateSessionService (DB 세션 생성) → SessionTracker
- 장점: 더미 해시로 타이밍 공격 완화, 로그인 시도 기록, 감사 로그, 세션 DB/Redis 연동 등 방어기제 존재

### 발견된 문제 (우선순위 포함)
- (높음) 세션 픽스테이션 위험: 로그인 시 `req.session` 재생성(regenerate) 없이 기존 sessionId를 그대로 사용하여 `req.login()`을 호출함. (취약점: 공격자가 고정된 세션ID를 주입하여 계정 탈취 가능)
- (높음) 계정 잠금 정책에 시간창 없음: 최근 N번 실패만 검사. 오래된 실패까지 포함될 수 있어 의도치 않은 잠금 발생 가능.
- (중간) CSRF 미확인: 세션 기반 인증 사용 시 CSRF 미들림/미들웨어 적용 여부 점검 필요 (envService.csrf 설정은 존재).
- (중간) 세션 페이로드 과다: `serializeUser`가 전체 `AuthenticatedUser`를 저장 → 세션 크기 증가 및 민감정보 노출 위험.
- (중간) Throttle: 현재 IP 기반만 사용 → 공유 IP 환경에서 오탐 가능. 계정(loginId) 기반 제한 병행 권장.

### 권장 조치 (우선순위 순)
1. 세션 재생성 (Session Fixation 방지) — 매우 권장
  - 위치: 로그인 컨트롤러(`user-auth.controller.ts`, `admin-auth.controller.ts`)
  - 구현: 로그인 직전 또는 직후 `req.session.regenerate()` 호출하여 새 sessionId를 발급한 뒤 `req.login()` 실행, 이후 `loginService.execute`에 `req.sessionID` 전달.
  - 예시:
```ts
// 세션 재생성 → 로그인 → DB 세션 생성 순서 (user-auth.controller)
await new Promise<void>((resolve, reject) =>
  req.session?.regenerate((err) => (err ? reject(err) : resolve())),
);
await new Promise<void>((resolve, reject) =>
  req.login(authenticatedUser as any, (err) => (err ? reject(err) : resolve())),
);
await this.loginService.execute({
  user: authenticatedUser,
  clientInfo,
  sessionId: req.sessionID,
  isAdmin: false,
});
```

2. 계정 잠금 정책에 시간창(윈도우) 추가 — 권장
  - Repository/API: `LoginAttemptRepository.listRecent`에 `since?: Date` 옵션 추가.
  - UseCase: 최근 5회 실패가 '최근 15분' 내에 발생했을 때만 잠금 적용(정책은 서비스 요구에 맞게 조정).
  - 예시 호출:
```ts
const since = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes
const recentAttempts = await this.loginAttemptRepository.listRecent({
  loginId,
  limit: 5,
  since,
});
```

3. CSRF 보호 검토 및 적용 — 권장
  - 위치: `apps/api/src/main.ts` (session 미들웨어 이후, 라우트 등록 전)
  - 동작: `envService.csrf.enabled` 확인 후 `csurf` 미들웨어 활성화, 토큰을 쿠키 또는 헤더로 전달하도록 클라이언트 가이드 제공.
  - 참고: API 클라이언트(예: fetch/axios)에서 `withCredentials: true`와 함께 CSRF 토큰 전송 필요.

4. 세션 직렬화 최소화 — 권장
  - 위치: `apps/api/src/common/auth/strategies/session.serializer.ts`
  - 권장: 세션에 저장하는 필드 축소 (`id`, `role`, `status`) — 대량 필드 제거로 Redis 세션 크기 및 동기화 비용 감소.

5. Throttle/Rate limit 강화 — 권장
  - IP 기반 외에 `loginId` 기반 또는 조합형(계정+IP) 백오프 추가.
  - 실패 누적 시점에 따른 지수적 딜레이(예: 2^n 초) 적용 고려.

6. 운영 설정 점검
  - `envService.session` 및 `envService.adminSession`의 `secure`, `httpOnly`, `sameSite`, `maxAgeMs` 값이 운영에 맞는지 확인.
  - Redis TTL과 DB `expiresAt` 동기화 정책 검증.

### 필요한 코드 변경 목록(우선순위)
- 변경(수정): [apps/api/src/modules/auth/credential/controllers/user/user-auth.controller.ts](apps/api/src/modules/auth/credential/controllers/user/user-auth.controller.ts) — 세션 재생성 적용
- 변경(수정): [apps/api/src/modules/auth/credential/controllers/admin/admin-auth.controller.ts](apps/api/src/modules/auth/credential/controllers/admin/admin-auth.controller.ts) — 세션 재생성 적용
- 변경(수정): [apps/api/src/modules/auth/credential/infrastructure/login-attempt.repository.ts](apps/api/src/modules/auth/credential/infrastructure/login-attempt.repository.ts) — `since` 파라미터 추가
- 변경(수정): [apps/api/src/modules/auth/credential/application/authenticate-identity.service.ts](apps/api/src/modules/auth/credential/application/authenticate-identity.service.ts) — `listRecent` 호출에 time window 적용
- 변경(수정): [apps/api/src/common/auth/strategies/session.serializer.ts](apps/api/src/common/auth/strategies/session.serializer.ts) — 직렬화 최소화
- 변경(검토): [apps/api/src/main.ts](apps/api/src/main.ts) — CSRF 미들웨어 적용 여부 확인/추가
- 테스트 추가: 세션 재생성(새 sessionID 발급), 계정 잠금(시간창 포함), CSRF 적용 테스트

### 검증/테스트 시나리오 (간단)
- 세션 재생성: 로그인 전후 `req.sessionID` 값이 변경되는지 확인. 이전 sessionID의 권한으로 접근이 차단되는지 확인.
- 잠금 정책: 같은 계정으로 5회 실패를 15분 내에 발생시켜 계정 잠금 예외가 발생하는지 확인. 15분 이후 실패 카운트가 초기화되는지 확인.
- CSRF: 브라우저 클라이언트에서 CSRF 토큰 없이 상태 변경 요청 시 403 발생 확인.
- 직렬화 필드 변경 시 Redis 세션 데이터가 정상적으로 업데이트되는지 확인.

### 다음 권장 작업 (제가 진행 가능)
1. 컨트롤러에 `req.session.regenerate()` 적용한 코드 패치 생성 (user/admin 두 파일) — 걸리는 시간: 약 15-30분
2. `LoginAttemptRepository`에 `since` 파라미터 추가 및 `AuthenticateIdentityService` 호출 수정 — 약 20-40분
3. `SessionSerializer`를 축소하고 Redis 동기화 테스트 추가 — 약 20-30분
4. CSRF 미들웨어(선택) 설정 PR 초안 작성 — 약 15-25분

원하시면 우선 1) 세션 재생성 패치를 제가 바로 적용하겠습니다.

## ✅ 우선순위 작업 (진행 상황)

아래는 우선순위가 높은 항목과 현재 진행 상태입니다. 이 체크리스트는 작업 우선순위와 진행 상황을 빠르게 확인하기 위한 요약입니다.

- [ ] 세션 재생성 적용 (user/admin) — 로그인 시 `req.session.regenerate()` 적용 (우선순위: 매우 높음)
- [ ] 계정 잠금 시간창 적용 — `LoginAttemptRepository.listRecent`에 `since` 추가 (우선순위: 높음)
- [ ] CSRF 미들웨어 적용 검토 — `main.ts`에서 `csurf` 적용 여부 확인 (우선순위: 중간)
- [ ] SessionSerializer 축소 — 세션에 저장하는 필드 최소화 (우선순위: 중간)
- [ ] Throttle 강화 (loginId/계정+IP) — IP 외 계정 기반 제한 추가 (우선순위: 중간)
- [ ] 테스트 추가: 세션 재생성, 계정 잠금(시간창), CSRF (우선순위: 중간)

진행 상태 요약:
- [x] 모듈 탐색 및 핵심 파일 수집
- [x] 로그인 핵심 서비스 코드 정밀 분석
- [x] 로그인 검토 문서 작성
- [ ] 세션/토큰 처리 검토
- [ ] 보안·예외·검증 취약점 점검
- [ ] 권장 수정사항 및 코드 패치 제안
- [ ] 테스트/추가 검증 지침 제공

다음 단계: 원하시면 제가 1) 세션 재생성 패치 적용부터 시작하겠습니다. 어느 작업을 먼저 진행할까요?

