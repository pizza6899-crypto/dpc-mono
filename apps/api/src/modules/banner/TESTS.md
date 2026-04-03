# Banner 모듈 테스트 및 통합 가이드

## 목적
- `banner` 모듈의 단위 및 통합 테스트 실행 절차, 요구사항, 문제해결 방법을 문서화합니다.

## 범위
- 단위 테스트: 서비스, 도메인, 매퍼, 컨트롤러
- 통합 테스트: `BannerRepository`의 create → read 플로우(테스트 DB 사용)

## 관련 파일
- **컨트롤러 테스트**: [apps/api/src/modules/banner/campaign/controllers/admin/banner-admin.controller.spec.ts](apps/api/src/modules/banner/campaign/controllers/admin/banner-admin.controller.spec.ts)
- **컨트롤러 테스트(공개)**: [apps/api/src/modules/banner/campaign/controllers/public/banner-public.controller.spec.ts](apps/api/src/modules/banner/campaign/controllers/public/banner-public.controller.spec.ts)
- **리포지토리 단위 테스트**: [apps/api/src/modules/banner/campaign/infrastructure/banner.repository.spec.ts](apps/api/src/modules/banner/campaign/infrastructure/banner.repository.spec.ts)
- **서비스 테스트(번역/파일 연동)**: [apps/api/src/modules/banner/campaign/application/banner-translation.service.spec.ts](apps/api/src/modules/banner/campaign/application/banner-translation.service.spec.ts)
- **CreateBannerService 테스트**: [apps/api/src/modules/banner/campaign/application/create-banner.service.spec.ts](apps/api/src/modules/banner/campaign/application/create-banner.service.spec.ts)
- **통합 테스트(스키마)**: [apps/api/test/integration/banner.repository.integration.spec.ts](apps/api/test/integration/banner.repository.integration.spec.ts)

## 요구사항
- Node.js, `pnpm`
- Prisma CLI(`pnpm -C apps/api exec -- prisma ...`) 사용 가능
- Postgres (통합 테스트용 별도 DB 또는 스키마). 절대 운영 DB를 사용하지 마세요.

## 빠른 시작 (로컬)

1) `.env.test` 준비

  - 예시: [apps/api/.env.test.example](apps/api/.env.test.example)
  - 복사 및 수정:

```bash
cp apps/api/.env.test.example apps/api/.env.test
# 편집: apps/api/.env.test 의 DATABASE_URL을 테스트 DB로 설정
# 예: postgresql://postgres:password@localhost:5432/dpc?schema=test_schema
```

2) (선택) 테스트 스키마 생성

```bash
# 테스트 DB에 접속하여 스키마 생성 (psql 또는 prisma db execute 사용)
DATABASE_URL="postgres://postgres:password@localhost:5432/dpc" \
  pnpm -C apps/api exec -- prisma db execute --file - <<'SQL'
CREATE SCHEMA IF NOT EXISTS test_schema;
SQL
```

3) 필요한 Postgres 확장 설치(테스트 DB 또는 public 스키마에 설치)

권장: 프로젝트에서 `prisma`를 통해 SQL 파일을 실행합니다.

```bash
# 예시: apps/api/scripts/create_test_extensions.sql 파일 생성 후 실행
DATABASE_URL="postgres://postgres:password@localhost:5432/dpc" \
  pnpm -C apps/api exec -- prisma db execute --file apps/api/scripts/create_test_extensions.sql
```

확장 목록 (프로젝트 `prisma/schema/common.prisma` 참조):
- `pg_trgm`, `unaccent`, `pgcrypto`, `citext`, `btree_gist`, `fuzzystrmatch`, `uuid-ossp`, `vector`, `tsm_system_rows`

4) Prisma 스키마 적용

```bash
DATABASE_URL="postgres://postgres:password@localhost:5432/dpc?schema=test_schema" \
  pnpm -C apps/api exec -- prisma db push --accept-data-loss
# 또는 마이그레이션 사용 시
DATABASE_URL="..." pnpm -C apps/api db:deploy
```

5) 단위 테스트 실행

```bash
# 배너 모듈 단위 테스트
pnpm -F api test -- apps/api/src/modules/banner
```

6) 통합 테스트 실행

```bash
TEST_DATABASE_URL="postgres://postgres:password@localhost:5432/dpc?schema=test_schema" \
  pnpm -C apps/api test:integration -- test/integration/banner.repository.integration.spec.ts
```

## 자주 발생하는 문제와 해결

- ERROR: operator class "gin_trgm_ops" does not exist for access method "gin"
  - 원인: `pg_trgm` 확장이 대상 스키마(public/test_schema)에 설치되지 않았거나 search_path 문제.
  - 해결: `pg_trgm`을 `public` 또는 target schema에 `CREATE EXTENSION`로 설치하거나 `prisma db execute`로 확장 설치 스크립트를 실행하세요.

- Jest 관련 ESM/dynamic import 오류
  - 원인: 테스트 코드에서 동적 `import()` 사용 시 jest 설정과 충돌.
  - 해결: 테스트 내 동적 import를 정적 import로 바꾸거나 jest 설정을 `--experimental-vm-modules`로 조정(권장하지 않음).

- Mock 반환이 예상 `Map`이 아닌 경우
  - 원인: `jest.fn()`의 결과 구조 때문에 `value`가 `undefined`로 래핑될 수 있음.
  - 해결: 통합 테스트에서는 간단한 async 구현으로 직접 반환하도록 변경했습니다(예: `async getUrlsByFileIds() { return new Map([...]); }`).

## CI(권장) — Github Actions 예시

파일: `.github/workflows/api-integration-tests.yml`

```yaml
name: API Integration Tests
on: [push, pull_request]
jobs:
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
          POSTGRES_DB: dpc
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: pnpm install
      - name: Create extensions (script)
        run: pnpm -C apps/api exec -- prisma db execute --file apps/api/scripts/create_test_extensions.sql
      - name: Apply schema
        run: |
          DATABASE_URL="postgres://postgres:password@localhost:5432/dpc?schema=test_schema" \
            pnpm -C apps/api exec -- prisma db push --accept-data-loss
      - name: Run integration tests
        run: |
          TEST_DATABASE_URL="postgres://postgres:password@localhost:5432/dpc?schema=test_schema" \
            pnpm -C apps/api test:integration -- test/integration/banner.repository.integration.spec.ts
```

> 참고: CI 환경에서는 DB 권한·확장 설치 권한이 제한될 수 있으므로, 확장 설치가 실패하면 자체 Postgres 이미지(또는 확장 포함 이미지)를 사용하거나 DB 사전 준비 단계를 추가해야 합니다.

## 변경 및 앞으로 할 일
- 임시 디버그 로그(`integration` 테스트) 제거 권장
- 통합 테스트의 격리성 강화: 각 테스트 전에 스키마 초기화 또는 트랜잭션 롤백 패턴 도입
- E2E 테스트(스토리지 목/로컬 S3 시뮬레이터 추가) 고려

---
문제나 추가 문서(예: CI 설정 파일 생성, 스크립트 추가)를 원하시면 알려주세요.
