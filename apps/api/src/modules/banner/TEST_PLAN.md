## Banner 모듈 테스트 계획

### 목적
- `banner` 모듈의 핵심 동작(도메인, 서비스, 리포지토리, 컨트롤러, 매퍼, 파일 연동)을 검증하여 회귀를 방지하고 계약을 문서화한다.

### 파일 위치
- 이 문서는 모듈 루트에 위치: `apps/api/src/modules/banner/TEST_PLAN.md`

### 우선순위 (빠른 가치 → 이후)
1. Controller 단위 테스트 (`BannerAdminController`, `BannerPublicController`) — 경계/DTO/권한/예외 처리
2. Repository 단위/통합 테스트 (`BannerRepository`) — `list`/`count` 필터, create/update 영속화, mapper 호환성
3. 트랜잭션 통합 테스트 (`CreateBannerService` 원자성) — create + attach + update가 원자적으로 동작하는지
4. 외부 서비스 계약 테스트 (`AttachFileService`, `FileUrlService`) — 호출 계약과 에러 처리
5. 에러/경계 케이스(중복 번역, 잘못된 날짜범위 등)
6. E2E(옵션): 테스트 DB + 목 스토리지로 전체 시나리오 테스트

### 테스트 타입 및 가이드라인
- 단위 테스트 (Jest): 모든 서비스/도메인/매퍼/컨트롤러에 대해 목(mock) 주입 사용
- 통합 테스트: 실제(또는 인메모리/테스트) DB 또는 트랜잭션 컨텍스트 사용
- E2E 테스트: 별도 테스트 DB/환경에서 실행(선택사항)

### 우선 작업 항목 상세

1) Controller 유닛 테스트 (우선 작성 권장)
- 대상: `BannerAdminController`, `BannerPublicController`
- 무엇을 테스트할까:
  - DTO 입력 변환 (Sqids 디코딩 포함)
  - 성공 흐름에서 올바른 서비스 호출 및 응답 DTO 반환
  - 예외 흐름: `BannerInvalidImageFileIdException`, validation error 대응
  - 권한 데코레이터(`RequireRoles`)는 데커레이터 레이어라 unit 테스트에서 직접 검증하기 어렵지만, 컨트롤러가 정상적으로 서비스 호출하는지를 확인
- 테스트 방법:
  - Nest `TestingModule`을 사용해 컨트롤러만 로드하고 서비스는 Jest mock으로 주입
  - Sqids를 모킹하여 decode 동작을 강제

2) Repository 단위/통합 테스트
- 대상: `BannerRepository`, `BannerMapper`
- 무엇을 테스트할까:
  - `toDomain`/`toPrisma` 변환 정확성
  - `list`/`count`의 date range, search, includeSoftDeleted 필터 매핑
  - `create`/`update`가 translations 생성/삭제 로직(현재 `deleteMany` 후 create)과 일관되게 동작
- 테스트 방법:
  - 단위: `BannerMapper`는 이미 커버. 추가로 `BannerRepository`는 Prisma 트랜잭션을 목(mock) 처리해 `tx.banner.create/update/findMany/count` 호출 파라미터 검증
  - 통합: 로컬 테스트 DB(환경이 허락되면) 또는 sqlite 테스트 DB로 실제 삽입/조회 수행

3) 트랜잭션 통합 테스트
- 대상: `CreateBannerService` 흐름
- 무엇을 테스트할까:
  - `repository.create` 성공 후 `translationService.replaceTranslations`가 실패하면 전체 원자성(rollback)이 보장되는지
  - 여러 실패 시 응답과 DB 상태(부분 생성 미발생) 확인
- 테스트 방법:
  - 테스트 트랜잭션을 제공하는 Nest 컨텍스트에서 실제 `BannerRepository`와 test DB를 사용
  - 또는 `@nestjs-cls/transactional`이 제공하는 트랜잭션 경계를 모킹하여 에러 시 rollback 시나리오 시뮬레이션

4) 외부 서비스 계약 테스트
- 대상: `AttachFileService`, `FileUrlService` 연동
- 무엇을 테스트할까:
  - `BannerTranslationService`가 올바른 fileIds를 전달하는지
  - `fileUrlService.getUrlsByFileIds`의 반환이 translations에 정확히 매핑되는지
  - 실패 케이스(attach 실패, url fetch 실패) 처리

5) 에러/경계 케이스
- 대상: 도메인 예외(`BannerInvalidDateRangeException`, `BannerDuplicateTranslationException`) 및 컨트롤러 에러 핸들링

6) E2E(선택)
- 시나리오: 배너 생성 → 파일 첨부 시퀀스 → public 조회(언어 우선) → soft-delete 확인

### 테스트 실무 규칙
- 모든 단위 테스트은 외부 시스템(네트워크, S3 등)을 모킹
- 통합 테스트은 별도 테스트 DB 연결 정보를 `.env.test`로 관리
- 테스트용 fixture/팩토리를 `apps/api/test/fixtures/banner.factory.ts`로 추가 권장

### 실행 방법 예시
```bash
# 개별 파일 테스트
pnpm -F api test -- apps/api/src/modules/banner/campaign/application/banner-translation.service.spec.ts

# 모듈 전체
pnpm -F api test -- apps/api/src/modules/banner

# 전체 API 패키지 테스트
pnpm -F api test
```

### 완료 기준 (Definition of Done)
- 각 서비스의 핵심 경로(성공, 주요 오류 경로)에 대해 단위 테스트가 존재
- `BannerRepository`의 주요 필터/영속성 동작이 단위 또는 통합 테스트로 검증됨
- 테스트는 로컬 CI(로컬 실행)에서 실패 없이 통과

### 다음 단계 (제안된 작업)
1. `BannerAdminController` 단위 테스트 파일 생성 및 커밋
2. `BannerPublicController` 단위 테스트 파일 생성 및 커밋
3. `BannerRepository`에 대해 목 기반 단위 테스트 추가

원하시면 1번부터 바로 생성해 진행하겠습니다.

### 작업 순서도 (단계별 실행 계획)
아래 순서대로 진행하면 작업 의존성과 검증 포인트가 명확합니다. 각 단계는 완료 체크포인트와 권장 명령을 포함합니다.

1) 준비 (환경 확인) — 5–15분
  - 체크포인트: `pnpm` 설치 및 `apps/api`에 `@types/jest` 포함, `tsconfig.json`에 `jest` 타입 포함
  - 명령:
    ```bash
    pnpm install
    pnpm -F api install
    ```

2) 컨트롤러 단위 테스트 작성 (우선순위 1) — 30–90분/컨트롤러
  - 작업: `BannerAdminController` 및 `BannerPublicController`의 유닛 테스트 추가
  - 체크포인트: 각 컨트롤러 테스트 파일이 커밋되고 `pnpm -F api test -- <file>`이 통과
  - 명령:
    ```bash
    pnpm -F api test -- apps/api/src/modules/banner/campaign/controllers/admin/banner-admin.controller.spec.ts
    ```

3) 리포지토리 단위 테스트 작성 (우선순위 2) — 1–2시간
  - 작업: `BannerRepository`의 핵심 호출 파라미터 확인용 단위 테스트(Prisma `tx` 목(mock)) 작성
  - 체크포인트: `list`/`count` 필터 파라미터 검증 테스트 통과

4) 리포지토리 통합 테스트 (테스트 DB) — 1–3시간
  - 작업: sqlite 또는 테스트 DB에 대해 `create`/`update`/`list` 시나리오 실행
  - 체크포인트: 실제 삽입 후 `getById`/`list`가 예상 값 반환
  - 권장: `.env.test`에 DB URL 지정

5) 트랜잭션 통합 테스트 (원자성 검증) — 1–3시간
  - 작업: `CreateBannerService` 실행 중 `translationService` 실패 시 DB가 롤백되는지 확인
  - 체크포인트: 실패 시 DB에 배너 레코드가 남아있지 않음

6) 외부 서비스 계약 테스트 — 30–90분
  - 작업: `AttachFileService`/`FileUrlService` 모킹으로 호출 계약과 실패 흐름 테스트
  - 체크포인트: `BannerTranslationService`의 실패/성공 흐름 검증

7) E2E (선택, CI용) — 2–6시간
  - 작업: 테스트 DB/스토리지 구성 후 전체 시나리오(생성→조회→삭제) 실행
  - 체크포인트: E2E 스위트 통과, CI에서 재현 가능

검증 및 커밋 규칙
- 각 단계 완료 시 작은 커밋 단위로 변경을 기록하세요. (예: `test(banner): add admin controller tests`)
- 테스트가 실패하면 해당 커밋을 revert하거나 수정한 뒤 다음 단계로 진행합니다.

이 순서대로 진행하면 빠른 피드백 루프를 유지하면서 안정적으로 전체 커버리지를 확장할 수 있습니다.
