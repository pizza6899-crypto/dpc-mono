# Auth 모듈 전체 테스트 지침서

작성일: 2026-04-03

목적
- `apps/api/src/modules/auth` 모듈의 전체 테스트(단위·통합·E2E·보안·성능)를 누락 없이, 일관성 있게 작성하기 위한 단계별 지침서입니다.
- 이 문서는 체크리스트, 우선순위, 테스트 범위, 모킹·피처 전략, 실행 명령어, CI 연동 방법까지 포함합니다. "테스트 생략"은 허용되지 않습니다.

대상 범위(포괄적)
- Application Services: 모든 `application/*` 서비스
- Domain: 모든 엔티티(`domain/model/*.ts`), VO, 정책(`policy.ts`)
- Infrastructure: Mapper, Repository, Redis/BullMQ 연동 유틸
- Controllers: 사용자·관리자용 컨트롤러의 라우트·유효성 검사·권한 체계
- Processors/Workers: BullMQ Processor 등
- 통합 흐름: 로그인·로그아웃·비밀번호 재설정·전화 인증·세션 만료·관리자 기능

사전 준비
- 로컬 개발 환경: Node.js, pnpm (레포 기준 `pnpm@10.x`), DB(테스트용 Postgres), Redis, (BullMQ 필요 시) — 팀 infra 담당자와 협의.
- 테스트 스크립트 확인: 루트에서 테스트 실행은 `pnpm api:test` (또는 `pnpm api:test:dev`) 사용.
- 테스트 DB 초기화: `apps/api/scripts/setup_test_db.sh` 또는 프로젝트의 테스트 DB 준비 스크립트 사용. (CI에서도 동일한 스크립트로 DB 준비)
- 환경 변수: `TEST_DATABASE_URL`, `REDIS_URL`, 기타 시크릿(테스트용 더미 값)을 CI/로컬에 설정.

테스트 레벨별 원칙
- Unit Test
  - 목표: 각 서비스/도메인의 비즈니스 로직 단독 검증.
  - 외부 의존(리포지토리, Redis, EnvService, CreateSessionService 등)은 Jest mock(`useValue`)으로 대체.
  - 테스트는 빠르고 독립적이어야 함.

- Integration Test
  - 목표: Repository, Mapper, Prisma 등의 영속성 계층 검증.
  - 실제 테스트 DB(별도 schema) 사용. 테스트 전 DB 초기화/시드 필요.

- E2E Test
  - 목표: 전체 인증 흐름(로그인→세션 생성→세션 동기화 등) 검증.
  - 실제 인프라(또는 경량화된 로컬 infra 컨테이너)를 사용하여 전체 스택 검증.

- Security / Behavior Tests
  - 타이밍 공격 완화 검증(더미 해시 비교 호출 여부), 권한 검증, 입력 검증 우회 시나리오 포함.

핵심 체크리스트(중요도 순)
1. Credential - 핵심 인증 로직 (최고 우선순위)
  - [ ] `VerifyCredentialService` 단위 테스트: 성공/사용자 없음/비밀번호 불일치/비활성/role 불일치/더미 해시 호출 여부
  - [ ] `AuthenticateIdentityService` 단위 테스트: 계정 잠금, 실패 기록(사유 구분), 성공 흐름
  - [ ] `RecordLoginAttemptService` 단위 테스트: `createSuccess`/`createFailure` 분기, repository 호출 인자 검증
  - [ ] `LoginService` 단위 테스트: 로그인 성공 기록 및 `CreateSessionService` 호출, `EnvService` 분기(isAdmin)
  - [ ] `LogoutService` 단위 테스트: `RevokeSessionService` 호출 성공/실패 로깅

2. Session - 세션 생명주기
  - [ ] `CreateSessionService` 단위 테스트: 기존 세션 종료 정책, `sessionTracker.terminateSession` 호출, `repository.create` 호출
  - [ ] `RevokeSessionService` 단위 테스트: 세션 조회→revoke→update, Redis/Socket 연동 호출 모킹
  - [ ] `UserSessionRepository` 통합 테스트: `findBySessionId`, `findActiveByUserId`, `findMany`, `create`, `update`, `deleteExpiredSessions`
  - [ ] `ExpireSessionsProcessor` 단위 테스트: job 이름에 따른 `expireSessionsBatchService.execute` 호출

3. Password & Reset
  - [ ] `ChangePasswordService` 단위 테스트: 현재 비밀번호 검증 실패/성공, `updatePassword` 호출
  - [ ] `RequestPasswordResetService` 단위 테스트: 사용자 없음(성공 반환), 토큰 생성/저장, 기존 토큰 삭제 호출
  - [ ] `ResetPasswordService` 단위 테스트: 잘못된 토큰 예외, 정상 흐름에서 `updatePassword` 및 `markAsUsed` 호출

4. Phone Verification
  - [ ] `RequestPhoneVerificationService` 단위 테스트: 번호 중복 차단, 빈도 제한(1분), 코드 6자리 생성 및 저장, `createAlertService` 호출
  - [ ] `VerifyPhoneService` 단위 테스트: 잘못된 토큰/만료/번호 불일치 예외, 정상 시 `updateVerifiedPhoneService.execute` 및 세션 동기화 호출

5. Management
  - [ ] `FindLoginAttemptsService` 단위 테스트: 필터 유효성 검사, limit 경계 값 테스트
  - [ ] `ResetUserPasswordAdminService` 단위 테스트: 권한 시나리오(SUPER_ADMIN, ADMIN, 실패 케이스), 비밀번호 생성/해싱/업데이트

6. Controllers (Unit & Integration)
  - [ ] 각 컨트롤러의 주요 엔드포인트(Unit): DTO 유효성 검사 실패, 성공 흐름(서비스 호출 모킹)
  - [ ] 컨트롤러 통합(E2E): 인증 플로우, 에러 상태, 권한체크

7. Infrastructure / Edge Cases
  - [ ] Mapper 단위 테스트: `toDomain`/`toPrisma` 양방향 변환 검증 (BigInt 직렬화 등)
  - [ ] Redis 관련 동작 검증: `updateRedisSessionData` 직렬화/TTL 보존 처리
  - [ ] BullMQ Processor 호출 흐름 검증

8. 비기능 (성능·동시성·보안)
  - [ ] 동시 로그인 시나리오(동시에 세션 생성, 기존 세션 종료 충돌) - race condition 시나리오 재현
  - [ ] 대량 만료 세션 배치 처리(성능 특성) — 간이 부하 테스트
  - [ ] 타이밍 공격 검증: `VerifyCredentialService`에서 더미 해시 비교가 항상 호출되는지 확인

테스트 케이스 작성 규칙(일관성)
- 파일 위치: 소스 코드 폴더에 `*.spec.ts`로 둡니다. 예: `credential/application/verify-credential.service.spec.ts`.
- 테스트 제목 패턴: `describe('VerifyCredentialService', () => { it('should return ...', () => {...}) })`
- Mock 네이밍: `{ tokenName }Mock` (예: `CREDENTIAL_USER_REPOSITORY` → `credentialUserRepoMock`)
- 공통 factory: `tests/factories/auth.factories.ts`에 `createCredentialUser()`, `createLoginAttempt()` 등 정의.
- 공통 mock helper: `tests/mocks/providers.ts`에 토큰별 기본 mock 구현 보관.

모킹 전략 (권장)
- Provider 토큰 목록 및 기본 mock 인터페이스
  - `LOGIN_ATTEMPT_REPOSITORY`: `{ create: jest.fn(), listRecent: jest.fn() }`
  - `CREDENTIAL_USER_REPOSITORY`: `{ findByLoginId: jest.fn(), findById: jest.fn() }`
  - `USER_SESSION_REPOSITORY`: `{ create: jest.fn(), update: jest.fn(), findActiveByUserId: jest.fn() }`
  - `PASSWORD_RESET_TOKEN_REPOSITORY`: `{ create: jest.fn(), deleteUnusedByUserId: jest.fn(), findByToken: jest.fn(), markAsUsed: jest.fn() }`
  - 기타: `EnvService`, `SessionTrackerService`, `CreateSessionService`, `RevokeSessionService`, `CreateAlertService` 등은 필요한 함수만 jest.fn()으로 제공.

샘플 테스트 템플릿 (단위 테스트 골격)
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { VerifyCredentialService } from './verify-credential.service';
import { CREDENTIAL_USER_REPOSITORY } from '../ports/out';
import { comparePassword } from 'src/utils/password.util';

jest.mock('src/utils/password.util');

describe('VerifyCredentialService', () => {
  let service: VerifyCredentialService;
  const credentialUserRepoMock = { findByLoginId: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyCredentialService,
        { provide: CREDENTIAL_USER_REPOSITORY, useValue: credentialUserRepoMock },
      ],
    }).compile();

    service = module.get<VerifyCredentialService>(VerifyCredentialService);
  });

  afterEach(() => jest.resetAllMocks());

  it('returns AuthenticatedUser when password matches', async () => {
    credentialUserRepoMock.findByLoginId.mockResolvedValue(
      /* CredentialUser.create(...) 또는 도메인 인스턴스 */
    );
    (comparePassword as jest.Mock).mockResolvedValue(true);

    const result = await service.execute({ loginId: 'a', password: 'p' });
    expect(result).not.toBeNull();
  });
});
```

통합 테스트(Repository) 예시 - 요약
- 실제 DB를 사용하는 테스트는 `beforeAll`에서 테스트 DB를 초기화하고, `afterAll`에서 정리합니다. `prisma` client 인스턴스를 테스트 전용으로 구성하세요.

E2E 테스트 지침(핵심 시나리오)
- 로그인 성공/실패 플로우(credential + session 연동)
- 비밀번호 재설정 요청 → 이메일/로그에 표시된 토큰 수령 → 토큰으로 재설정
- 휴대폰 인증: 요청 → 코드 전송(알림 모킹) → 검증
- 관리 기능: 로그인 시도 조회, 관리자 비밀번호 초기화

테스트 자동화 · CI 연동
- CI 단계
  1. 테스트용 DB 컨테이너(또는 managed test DB) 기동
  2. `pnpm install --frozen-lockfile`
  3. `pnpm api:db:push` 또는 `apps/api/scripts/setup_test_db.sh` 실행
  4. `pnpm api:test` 실행
- 병렬화: 테스트가 DB에 의존하면 병렬 실행 시 충돌이 발생할 수 있으므로 DB-의존 통합 테스트는 태그로 분리하고 직렬 실행을 권장.

검증 포인트(테스트 완료 체크리스트)
- 모든 Application Services에 대해 최소 1개의 성공 케이스와 1개의 주요 실패 케이스 존재
- Domain 엔티티의 핵심 비즈니스 메서드(예: `UserSession.revoke`, `LoginAttempt.fromPersistence`) 테스트
- Mapper 변환 양방향(`toDomain`⇄`toPrisma`) 테스트
- Repository 주요 쿼리 동작(Integration) 테스트
- 컨트롤러의 입력 유효성 검사 및 권한 체크 테스트
- Processor(작업자)에서는 스케줄/잡 처리 흐름 검증
- 보안 검증: 토큰 만료, 잘못된 입력, 권한 없는 접근, 타이밍 공격 완화

우선 적용 순서(권장 단계별 진행)
1. Setup: 공통 factory/mocks, jest config 확인, 테스트 DB 준비 스크립트 동작 확인
2. 최상위 단위(credential 서비스들) 테스트 작성 및 병합
3. session 관련 단위 테스트 및 Mapper/Repository 통합 테스트 병행
4. password / phone-verification / management 서비스 테스트 작성
5. 컨트롤러 단위 테스트 및 주요 E2E 시나리오 작성
6. Processor 및 비기능 테스트(동시성, 성능) 작성
7. CI 파이프라인에 테스트 추가 및 flaky test 모니터링

문제 발생 시 디버깅 팁
- 실패한 테스트에서 Mock 호출 인자(`expect(mock).toHaveBeenCalledWith(...)`)를 찍어 실제 인자 비교
- 통합 테스트에서 DB 상태 확인은 Prisma studio 또는 테스트용 쿼리로 직접 확인
- 비동기/시간 관련 테스트는 `jest.useFakeTimers()`를 적절히 활용

다음 단계 제안
1. 이 지침을 바탕으로 제가 `VerifyCredentialService`, `AuthenticateIdentityService`, `RecordLoginAttemptService`의 테스트 템플릿(구현 골격)을 생성해 드리겠습니다.
2. 이어서 Repository 통합 테스트 템플릿과 E2E 시나리오 템플릿을 순차적으로 생성합니다.

파일 위치: [apps/api/src/modules/auth/TESTING_GUIDE.md](apps/api/src/modules/auth/TESTING_GUIDE.md)
