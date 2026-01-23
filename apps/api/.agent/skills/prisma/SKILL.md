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

## PostgreSQL 익스텐션 (Advanced Features)
프로젝트의 성능 최적화와 고급 기능을 위해 원격 DB 엔진의 다양한 익스텐션을 활용합니다.

### 1. Prisma 직접 관리 (Schema-level)
`common.prisma`의 `extensions` 배열에 정의되어 있으며, Prisma 마이그레이션을 통해 활성화됩니다.
*   **`vector`**: AI 및 벡터 검색 기능 (`pgvector`).
*   **`pg_trgm`, `fuzzystrmatch`**: 퍼지 텍스트 검색 및 유사도 계산.
*   **`citext`**: 대소문자를 구분하지 않는 텍스트 타입.
*   **`btree_gist`**: GiST 인덱스 지원 (동시성 및 기하학적 쿼리).
*   **`pgcrypto`, `uuid_ossp`**: 암호화 함수 및 UUID 생성.

### 2. 인프라 레벨 관리 (Manual Migration)
DB 엔진 성능과 직접 관련되거나 시스템 레벨의 설정이 필요한 익스텐션은 Prisma `extensions`에 포함하지 않고, 초기 설정 마이그레이션(`init.sql` 등)으로 직접 설치/관리합니다.
*   **`pg_partman`**: 대규모 데이터(로그, 트랜잭션 등)의 자동 파티셔닝 관리.
*   **`pg_cron`**: DB 내부 스케줄링 (주기적인 집계 및 데이터 정리).
*   **`pg_repack`**: 서비스 중단 없이 테이블 및 인덱스 온라인 재구축 (Bloat 제거).
*   **`pg_stat_statements`**: 쿼리 성능 모니터링 및 분석.

> **주의**: `pg_cron` 등 일부 익스텐션은 설치 순서나 권한 문제로 인해 Prisma 마이그레이션 시 에러를 유발할 수 있으므로, 반드시 문서화된 인프라 설정 가이드를 따르십시오.

## 서비스/리포지토리 구현 패턴
이 프로젝트는 `nestjs-cls`의 트랜잭션 프록시를 기반으로 하며, 모든 데이터 접근 로직은 `@InjectTransaction()`으로 주입받은 전용 객체를 통해 수행됩니다.

### 1. 기본 전략: Prisma Fluent API
대부분의 CRUD와 단순 관계 쿼리는 Prisma의 플루언트 API(`findUnique`, `findMany`, `create` 등)를 우선적으로 사용합니다. 이는 높은 가독성과 타입 안전성을 제공합니다.

### 2. 확장 전략: Kysely (Complex/Raw Queries)
Prisma가 직접 지원하지 않는 집계 로직, 복잡한 윈도우 함수, 또는 고성능이 필요한 로우 쿼리가 필요한 경우에만 `this.tx.$kysely`를 통해 Kysely를 사용합니다.

### `@InjectTransaction()` 사용 예시
```typescript
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

@Injectable()
export class MyService {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async processData() {
    // 1. Prisma Fluent API (우선 사용)
    const user = await this.tx.user.findUnique({ where: { id: 1 } });
    
    // 2. Kysely (Prisma가 지원하지 않는 복잡한 쿼리/로우 쿼리 시)
    // await this.tx.$kysely.selectFrom(...)...
  }
}
```

## 동시성 제어 (Concurrency Control)

Prisma 자체의 낙관적 락(`@version`)이나 비관적 락을 사용하는 대신, **PostgreSQL Advisory Lock**을 활용하여 애플리케이션 레벨에서 동시성을 제어합니다.

*   **Advisory Lock 사용**: 특정 리소스에 대한 락이 필요한 경우, `pg_advisory_xact_lock` 등을 사용하여 트랜잭션 범위 내에서 락을 획득합니다.
*   **구현 방식**: `infrastructure` 레이어 또는 별도의 `ConcurrencyService` 등을 통해 락 로직을 캡슐화하여 사용합니다.
