---
name: prisma_schema_management
description: Prisma 스키마 관리 및 멀티 파일 구조 가이드
---

# Prisma Schema Management Skill

Prisma 스키마를 효율적으로 관리하고, 멀티 파일 구조에서의 작업 흐름을 정의합니다.

## 디렉토리 구조

`apps/api/prisma/schema/*.prisma` 형식으로 도메인별 스키마 파일을 분리하여 관리합니다.

```
apps/api/prisma/schema/
├── common.prisma        # 공통 Enum, 기본 User 모델 등
├── wallet.prisma        # 지갑, 트랜잭션 등 금융 관련 모델
├── game.prisma          # 게임 라운드, 세션 등 게임 로직 관련 모델
├── deposit.prisma       # 입금 관련
├── withdrawal.prisma    # 출금 관련
└── ...
```

## 작업 워크플로우

1.  **스키마 수정**: 해당 도메인에 맞는 `.prisma` 파일을 수정하거나 새로 생성합니다.
2.  **관계 설정**: 다른 파일에 있는 모델과 관계(Relation)를 맺을 때는 모델명만 정확히 참조하면 됩니다. (Prisma가 알아서 연결)
3.  **DB 동기화**: `pnpm db:push` 또는 마이그레이션 생성 (`pnpm db:migrate`)을 실행합니다.

## 주의사항

*   **모델 중복 금지**: 서로 다른 파일에 동일한 이름의 모델(`model User { ... }`)을 정의하면 충돌이 발생합니다.
*   **순환 참조**: 파일 간 순환 참조는 허용되지만, 복잡도가 높아지지 않도록 주의합니다.

## 주요 명령어

*   `pnpm db:generate`: Prisma Client 생성 (타입 업데이트)
*   `pnpm db:push`: 스키마 변경 사항을 DB에 즉시 반영 (개발용)
*   `pnpm db:migrate`: 마이그레이션 파일 생성 및 적용 (배포용)

## 동시성 제어 (Concurrency Control)

Prisma 자체의 낙관적 락(`@version`)이나 비관적 락을 사용하는 대신, **PostgreSQL Advisory Lock**을 활용하여 애플리케이션 레벨에서 동시성을 제어합니다.

*   **Advisory Lock 사용**: 특정 리소스에 대한 락이 필요한 경우, `pg_advisory_xact_lock` 등을 사용하여 트랜잭션 범위 내에서 락을 획득합니다.
*   **구현 방식**: `infrastructure` 레이어 또는 별도의 `ConcurrencyService` 등을 통해 락 로직을 캡슐화하여 사용합니다.
