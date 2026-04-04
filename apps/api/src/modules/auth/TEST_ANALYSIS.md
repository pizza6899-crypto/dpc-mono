# Auth 모듈 상세 분석 및 테스트 대상 목록

작성일: 2026-04-03

목적
- `/apps/api/src/modules/auth` 모듈의 구조와 각 구성요소(서비스, 컨트롤러, 도메인, 리포지토리 등)를 분석하고
  우선적으로 작성할 단위 테스트 대상과 테스트 시나리오(우선순위 포함)를 정리합니다.

요약
- 이 모듈은 하위 모듈로 `credential`, `password`, `session`, `phone-verification`, `management` 등을 포함합니다.
- 핵심 테스트 대상은 각 하위 모듈의 Application Service와 Domain Entity, 그리고 Infrastructure의 Mapper/Repository입니다.

상세 구조 및 핵심 파일
- 모듈 엔트리: `apps/api/src/modules/auth/auth.module.ts`

- Credential (자격증명)
  - 모듈 파일: `credential/credential.module.ts`
  - 주요 Application Services:
    - `AuthenticateIdentityService` (`application/authenticate-identity.service.ts`) — 계정 잠금 검사, 자격검증(비밀번호), 실패 시도 기록 흐름
    - `VerifyCredentialService` (`application/verify-credential.service.ts`) — 사용자 조회, 비밀번호 비교, 관리자/사용자 구분, 더미 해시로 타이밍 공격 완화
    - `RecordLoginAttemptService` (`application/record-login-attempt.service.ts`) — 성공/실패 시도 엔티티 생성 및 영속화
    - `LoginService` (`application/login.service.ts`) — 로그인 성공 후 기록 및 세션 생성 로직(EnvService, CreateSessionService 사용)
    - `LogoutService` (`application/logout.service.ts`) — 로그아웃 시 세션 종료 (RevokeSessionService 사용)
  - Domain: `domain/model/credential-user.entity.ts`, `domain/model/login-attempt.entity.ts`, `domain/policy.ts`, `domain/exception.ts`
  - Infrastructure:
    - `credential-user.repository.ts`, `login-attempt.repository.ts` (Prisma 트랜잭션 사용)
    - `credential-user.mapper.ts`, `login-attempt.mapper.ts`
  - 컨트롤러: `controllers/user/user-auth.controller.ts`, `controllers/admin/admin-auth.controller.ts`

- Session (세션)
  - 모듈 파일: `session/session.module.ts`
  - 주요 Application Services:
    - `CreateSessionService` (`application/create-session.service.ts`) — 기존 세션 조회, 정책 적용에 따른 세션 종료, 새 세션 생성
    - `ExpireSessionService`, `ExpireSessionsBatchService`, `ExpireUserSessionsService`, `RevokeSessionService`, `ListSessionsService`, `SynchronizeUserSessionService`
  - Domain: `domain/model/user-session.entity.ts`, `device-info.vo.ts`, `session-type.enum.ts`, `session-status.enum.ts` 등
  - Infrastructure: `user-session.repository.ts`, `user-session.mapper.ts`, `session-tracker.service.ts`, Redis/BullMQ 연동 코드
  - 관리용 컨트롤러: `controllers/admin/session-admin.controller.ts`

- Password (비밀번호)
  - 모듈 파일: `password/auth-password.module.ts`
  - 주요 Application Services:
    - `ChangePasswordService` — 현재 비밀번호 확인 후 업데이트
    - `RequestPasswordResetService` — 존재하지 않는 사용자도 성공 응답 반환(타이밍 공격 완화), 토큰 생성/저장
    - `ResetPasswordService` — 토큰 검증, 비밀번호 해싱 및 업데이트, 토큰 사용 처리
  - Infrastructure: `password-reset-token.repository.ts`
  - 컨트롤러: `controllers/user-password.controller.ts` (DTO 다수 존재)

- Phone Verification (휴대폰 인증)
  - `RequestPhoneVerificationService` — 중복/도배 방지, 6자리 코드 생성, 토큰 저장, 알림(알림 서비스 호출)
  - `VerifyPhoneService` — 토큰 검증(번호 일치/만료), 사용자 업데이트, 토큰 사용 처리, 세션 동기화 호출

- Management (관리)
  - `FindLoginAttemptsService` — 필터 검증 및 최근 로그인 시도 조회
  - `ResetUserPasswordAdminService` — 관리자 권한 검증 및 대상 사용자 비밀번호 초기화

- Processors / 작업자
  - `infrastructure/processors/expire-sessions.processor.ts` — 주기적 만료 세션 정리 호출 (BullMQ Processor)

테스트 전략 (권장)
- 단위 테스트 우선순위
  1. Credential: `VerifyCredentialService`, `AuthenticateIdentityService`, `RecordLoginAttemptService`, `LoginService`
  2. Session: `CreateSessionService`, `RevokeSessionService`, `SynchronizeUserSessionService`
  3. Password: `ChangePasswordService`, `RequestPasswordResetService`, `ResetPasswordService`
  4. Phone-verification: `RequestPhoneVerificationService`, `VerifyPhoneService`
  5. Management: `FindLoginAttemptsService`, `ResetUserPasswordAdminService`
  6. Processor: `ExpireSessionsProcessor` (프로세서의 경우 간단한 유닛/통합 테스트로 처리)

- 테스트 유형
  - Unit Tests: 서비스 로직, 정책, 도메인 엔티티 검증. 외부 의존(리포지토리, Redis, EnvService, CreateSessionService 등)은 Jest mock으로 주입.
  - Integration Tests: Repository와 Mapper는 Prisma와 test DB를 사용하는 통합 테스트 권장 (이미 `scripts/setup_test_db.sh` 등 존재). 테스트 DB는 `TEST_DATABASE_URL`이나 별도 환경으로 구성.
  - E2E: 인증 흐름(로그인→세션생성 등) 전체 경로 테스트는 `apps/api`의 e2e 테스트 설정을 활용.

구체적 테스트 케이스 예시 (우선 구현 권장)
- `VerifyCredentialService`
  - 정상: 저장된 `passwordHash`와 일치하면 `AuthenticatedUser` 반환
  - 실패: 사용자 없음 → `null` 반환 (DUMMY_HASH 비교로 타이밍 유지)
  - 실패: 비밀번호 불일치 → `null`
  - 실패: 비활성 사용자 또는 role 불일치(관리자 플래그) → `null`
  - 경계: `passwordHash`가 없을 때 동작

- `AuthenticateIdentityService`
  - 계정 잠금: `loginAttemptRepository.listRecent`이 정책에 의해 잠금 조건이면 `AccountLockedException` 발생 및 실패 시도 기록 호출 확인
  - 인증 실패: `verifyService.execute`가 `null` 반환 시 `LoginFailedException` 발생 및 실패 시도 기록(사용자 존재 여부에 따른 failureReason) 호출 확인
  - 인증 성공: `verifyService.execute`가 유저 반환 시 해당 유저 반환

- `RecordLoginAttemptService`
  - 성공 시: `LoginAttempt.createSuccess` 로컬 생성 후 repository.create 호출
  - 실패 시: `LoginAttempt.createFailure` 및 failureReason 필수 검증

- `LoginService`
  - 성공 흐름: `recordService.execute` 호출, `createSessionService.execute` 호출 (isAdmin에 따른 sessionConfig 사용)
  - 트랜잭션: recordService 실패 시 예외 전파(트랜잭션 롤백 시나리오는 통합 테스트로 검증)

- `CreateSessionService`
  - 기존 활성 세션 중 정책에 의해 종료 대상이 있으면 `repository.update` 호출 및 `sessionTracker.terminateSession` 호출
  - 새 세션 생성 시 `repository.create` 호출 및 반환 값 확인

- `RequestPasswordResetService` / `ResetPasswordService`
  - 존재하지 않는 사용자일 때 timing-attack 대비 성공 반환
  - 토큰 생성/저장, 만료시간 설정, `tokenRepository.markAsUsed` 호출
  - `ResetPasswordService`: 잘못된 토큰 → `InvalidPasswordResetTokenException`

- `RequestPhoneVerificationService` / `VerifyPhoneService`
  - 발송 빈도 제한(1분) 검증 (TooManyVerificationRequestsException)
  - 코드 생성 범위(6자리) 및 토큰 저장 호출 확인
  - 검증 시 잘못된 토큰/번호/만료 → 적절한 예외 발생
  - 성공 시 `updateVerifiedPhoneService.execute`와 `synchronizeUserSessionService.execute` 호출

- `FindLoginAttemptsService`
  - 필터 검증: `loginId`와 `ipAddress` 모두 빈 값이면 `BadRequestException`
  - limit 검증: 범위 밖 값이면 예외

테스트 구현 가이드 (기술적 제안)
- 프레임워크: Jest + ts-jest (현재 레포의 기존 테스트 설정을 따름)
- Nest TestingModule 사용: 각 서비스 단위 테스트에서 `Test.createTestingModule`로 모듈을 구성하고, 외부 의존은 `useValue`/`useFactory`로 모킹
  - 예: `provide: LOGIN_ATTEMPT_REPOSITORY, useValue: { create: jest.fn(), listRecent: jest.fn() }`
- 트랜잭션 데코레이터(`@Transactional`)가 있는 서비스는 단위 테스트에서 데코레이터로 인한 부작용이 없도록 Mocking/설정 필요 (현재 프로젝트에서 사용되는 `@nestjs-cls/transactional`의 테스트 가이드 준수)
- Prisma 기반 Repository는 통합 테스트로 검증 (테스트 DB 준비 스크립트 활용)

우선순위로 만들 테스트 파일 목록 (권장 순서)
- `credential/application/verify-credential.service.spec.ts`
- `credential/application/authenticate-identity.service.spec.ts`
- `credential/application/record-login-attempt.service.spec.ts`
- `credential/application/login.service.spec.ts`
- `session/application/create-session.service.spec.ts`
- `password/application/change-password.service.spec.ts`
- `password/application/request-password-reset.service.spec.ts`
- `phone-verification/application/request-phone-verification.service.spec.ts`

참고: 테스트에서 주입해야 할 토큰 목록 (예시)
- `LOGIN_ATTEMPT_REPOSITORY`, `CREDENTIAL_USER_REPOSITORY`, `USER_SESSION_REPOSITORY`, `PASSWORD_RESET_TOKEN_REPOSITORY`, `PHONE_VERIFICATION_REPOSITORY`

다음 단계 제안
1. 우선순위 1~3(위의 목록)에 해당하는 서비스 3~4개에 대한 테스트 템플릿을 생성합니다.
2. 각 템플릿에는 성공 케이스와 주요 실패 케이스(예외 발생)를 포함시키고, 필요한 mock provider들을 함께 생성합니다.

원하시면 바로 첫 3개의 서비스(`VerifyCredentialService`, `AuthenticateIdentityService`, `RecordLoginAttemptService`)의 테스트 파일 템플릿을 생성해 드리겠습니다.

## 테스트 작성 범위 및 역할 분담

- **범위 (우선순위)**:
  - 1순위(단위): `VerifyCredentialService`, `AuthenticateIdentityService`, `RecordLoginAttemptService`, `LoginService` — 유닛 테스트 (외부 의존은 mock).
  - 2순위(단위/통합): `CreateSessionService`, `RevokeSessionService`, `SynchronizeUserSessionService` — 유닛 우선, 리포지토리는 통합 테스트로 검증.
  - 3순위(단위): `ChangePasswordService`, `RequestPasswordResetService`, `ResetPasswordService`, `RequestPhoneVerificationService`, `VerifyPhoneService`.
  - 4순위(통합/시스템): Repository/Mapper, Processor, E2E 흐름(로그인→세션 등).

- **역할(권장)**:
  - **Test Author**: 테스트 코드 작성 및 초기 Mock/Fixture 생성.
  - **Test Reviewer**: 테스트 논리·경계조건 검토, 결함 감지.
  - **Mock Maintainer**: 공용 mock/factory 유지, 중복 제거.
  - **DB/Infra Lead**: 통합 테스트용 DB/환경(테스트 시나리오, seed) 관리.
  - **CI Owner**: CI 파이프라인에 테스트 실행·캐싱 설정 적용.

- **진행 방식 제안**:
  - PR 단위로 1~2개 서비스 테스트 추가 → 리뷰 → 병합 반복.
  - 단위 테스트는 `jest`로 빠르게 검증, Repository는 테스트 DB로 통합 검증.

## 테스트 케이스(간략 업데이트)

- `VerifyCredentialService`:
  - 정상: valid hash → `AuthenticatedUser` 반환.
  - 사용자 없음: user null → `null` 반환 (DUMMY_HASH 비교가 호출되는지 확인).
  - 비밀번호 불일치: `null`.
  - 비활성/role 불일치: `null`.

- `AuthenticateIdentityService`:
  - 계정 잠금: `loginAttemptRepository.listRecent`가 잠금 조건이면 `AccountLockedException` 및 `recordService.execute` 실패 기록 호출.
  - 인증 실패(사용자 없음/비밀번호 불일치): `LoginFailedException` 및 적절한 `failureReason`으로 기록.
  - 인증 성공: `verifyService.execute`가 반환한 `AuthenticatedUser` 반환.

- `RecordLoginAttemptService`:
  - 성공 시: `result=SUCCESS`, `repository.create` 호출, 반환된 `LoginAttempt` 검증.
  - 실패 시: `result=FAILED`, `failureReason` 필수 검증, `repository.create` 호출.

- `LoginService`:
  - 정상 흐름: `recordService.execute` 및 `createSessionService.execute` 호출 확인.
  - `envService`에 따른 만료시간/설정 분기 검증(isAdmin true/false).

- `CreateSessionService`:
  - 기존 세션 정책에 따라 종료 대상이 있으면 `repository.update`와 `sessionTracker.terminateSession` 호출.
  - 새 세션 생성 시 `repository.create` 호출 및 반환된 `UserSession` 검증.

--- 
작업을 진행해도 될까요? 바로 테스트 템플릿 3개를 생성해 드리겠습니다.
