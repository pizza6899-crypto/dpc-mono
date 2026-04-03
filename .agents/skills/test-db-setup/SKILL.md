---
name: test-db-setup
description: "로컬에서 apps/api 테스트 DB 셋업을 자동화하는 스킬. TEST_DATABASE_URL 또는 .env.test를 사용해 Postgres 확장 설치, 테스트 스키마 생성, prisma db push 적용을 안전하게 수행합니다. USE FOR: 로컬 통합 테스트 전 DB 준비, test schema 재생성, 확장 설치 문제 점검, setup_test_db.sh 사용 가이드. DO NOT USE FOR: 운영 DB 변경, 원격 관리형 DB 직접 수정, CI 전용 파이프라인 설계."
argument-hint: "입력 예: .env.test 사용, schema=test_schema, skip-push 여부, dry-run 여부"
---

# Test DB Setup

## 목적

`apps/api` 로컬 개발 환경에서 테스트 DB 준비를 반복 가능하고 안전하게 자동화한다.

- Postgres 확장 설치
- 테스트 스키마 생성 또는 지정
- Prisma 스키마 적용(`db push`)
- 원격/운영 DB 오적용 방지

## 언제 사용하나

- 통합 테스트를 돌리기 전에 테스트 DB를 빠르게 준비해야 할 때
- `gin_trgm_ops`, `pg_trgm`, `vector` 같은 확장 관련 오류를 점검할 때
- `.env.test` 또는 `TEST_DATABASE_URL` 기준으로 로컬 DB를 재설정하고 싶을 때

## 사용하지 말아야 할 때

- 운영 DB 또는 공유 개발 DB를 변경할 때
- 마이그레이션 전략 검토가 필요한 배포 작업일 때
- CI 전용 워크플로우 설계가 주목적인 경우

## 사용 자산

- 스크립트: `apps/api/scripts/setup_test_db.sh`
- SQL: `apps/api/scripts/create_test_extensions.sql`
- 환경 파일(선택): `apps/api/.env.test`

## 입력 규칙

- 우선 순위:
  1. `TEST_DATABASE_URL`
  2. `DATABASE_URL`
  3. `apps/api/.env.test`의 `DATABASE_URL` (`--use-dotenv` 또는 fallback)
- 지원 플래그:
  - `--use-dotenv`: `.env.test` 사용
  - `--schema <name>`: 스키마 이름 강제 지정
  - `--skip-push`: `prisma db push` 생략
  - `--dry-run`: 실제 실행 없이 예정 작업 출력
  - `--force`: 비로컬 호스트에도 실행 허용

## 절차

1. 입력 URL 결정
- `TEST_DATABASE_URL`이 있으면 우선 사용
- 없으면 `.env.test`를 읽는다

2. 안전성 검사
- `pnpm` 존재 확인
- `pnpm -C apps/api exec -- prisma -v`로 Prisma 접근 가능 여부 확인
- DB 호스트가 `localhost`, `127.*`, `::1`, `host.docker.internal`, 사설 IP 대역(`10.*`, `192.168.*`, `172.16.*`~`172.31.*`)인지 확인
- 비로컬 호스트는 `--force` 없이는 차단

3. 준비 상태 점검
- `pg_isready`가 있으면 호스트/포트 기준으로 DB 준비 상태를 확인
- `pg_isready`가 없으면 readiness 체크는 건너뛰되 경고 없이 계속 진행

4. 확장 설치
- `apps/api/scripts/create_test_extensions.sql` 실행
- 확장 생성 실패는 WARN으로 처리하고 계속 진행
- 성공 시 `Created extension: ...` 로그를 남긴다

5. 스키마 준비
- `CREATE SCHEMA IF NOT EXISTS <schema>` 실행
- 실패 시 경고를 출력하고 다음 단계 진행 여부를 판단한다

6. Prisma 스키마 적용
- 기본: `pnpm -C apps/api exec -- prisma db push --accept-data-loss`
- `--skip-push`가 있으면 생략

## 권장 실행 예시

```bash
# .env.test 사용
bash apps/api/scripts/setup_test_db.sh --use-dotenv

# 스키마 지정
bash apps/api/scripts/setup_test_db.sh --use-dotenv --schema test_schema

# 실제 실행 전 확인
bash apps/api/scripts/setup_test_db.sh --use-dotenv --dry-run

# db push 생략
bash apps/api/scripts/setup_test_db.sh --use-dotenv --skip-push

# 직접 URL 지정
TEST_DATABASE_URL="postgres://postgres:password@localhost:5432/dpc?schema=test_schema" \
  bash apps/api/scripts/setup_test_db.sh
```

## 로컬 검증 절차

```bash
# 스크립트 문법 점검
bash -n apps/api/scripts/setup_test_db.sh

# 예정 작업 확인
bash apps/api/scripts/setup_test_db.sh --use-dotenv --dry-run

# 실제 적용
bash apps/api/scripts/setup_test_db.sh --use-dotenv

# 통합 테스트 실행
DATABASE_URL=$(grep -E '^DATABASE_URL=' apps/api/.env.test | sed 's/DATABASE_URL=//; s/^"//; s/"$//') \
TEST_DATABASE_URL=$DATABASE_URL \
pnpm -C apps/api test:integration -- test/integration/banner.repository.integration.spec.ts
```

## 실패 처리 원칙

- 확장 생성 권한 부족: WARN 출력 후 계속 진행
- 특정 확장 부재로 `db push` 실패: 어떤 확장이 필요한지와 로컬 Postgres 이미지 교체 필요성을 함께 안내
- 비로컬 호스트 감지: `--force` 요구 후 중단
- `.env.test` 없음: `TEST_DATABASE_URL` 지정 또는 `.env.test` 생성 안내
- `pnpm`/`prisma` 미설치: 명확한 설치 또는 실행 경로 안내

## 로컬 우선 권장 사항

- CI보다 먼저 로컬 자동화가 안정적으로 동작하는지 확인한다
- 확장 문제가 반복되면 확장 포함 Postgres 이미지 사용을 고려한다
- 비밀번호가 포함된 DB URL은 로그에 그대로 출력하지 않는다

## 완료 기준

- 같은 스크립트를 여러 번 실행해도 안전하다
- 로컬/사설 IP는 기본 허용되고, 원격 DB는 `--force` 없이는 차단된다
- 확장 설치, 스키마 생성, Prisma 적용 순서가 일관되다
- 성공 시 `[setup_test_db] Done.` 로그가 출력된다

## 예시 프롬프트

- `apps/api 테스트 DB 셋업 스킬로 .env.test 기준 dry-run 해줘`
- `test_schema로 로컬 테스트 DB 준비하고 db push까지 실행해줘`
- `확장 설치만 먼저 하고 prisma push는 생략해줘`