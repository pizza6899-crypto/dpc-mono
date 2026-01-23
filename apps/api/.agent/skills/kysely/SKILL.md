---
name: kysely_implementation
description: Kysely Implementation Expert (Prisma Integration)
---

# Skill: Kysely Implementation Expert (Prisma Integration)

## 🎯 Role & Context
이 스킬은 Prisma를 기반으로 구축된 NestJS 모노레포 환경에서 **Kysely**를 사용하여 Type-safe한 SQL 쿼리를 작성하는 가이드를 제공합니다. `prisma-extension-kysely`를 통해 Prisma Client와 완벽하게 통합되어 있으며, `nestjs-cls`를 통해 트랜잭션 컨텍스트를 안전하게 공유합니다.

### 언제 Kysely를 사용하나요?
1. **Prisma Fluent API 우선**: 기본적인 CRUD와 관계 쿼리는 Prisma를 사용합니다.
2. **Kysely 사용 시점**:
    - 복잡한 조인, 집계 함수, 윈도우 함수가 필요한 경우
    - Prisma가 지원하지 않는 특정 DB 엔진 전용 기능을 직접 사용할 때
    - 최적화된 로우 쿼리(Raw Query)가 필요한 경우

## 📁 Critical Locations (Paths)
- **Kysely Types:** `apps/api/src/generated/kysely/kysely-types.ts`
- **Prisma Module & Proxy Type:** `apps/api/src/infrastructure/prisma/prisma.module.ts`

## 🛠 Usage Rules

### 1. Repository/Service Implementation Pattern
`nestjs-cls`를 통해 주입받은 `this.tx`(프록시 객체)를 활용하며, 타입 정의는 `PrismaTransaction`을 사용합니다.

**권장 패턴:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { sql } from 'kysely';

@Injectable()
export class MyRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async findComplexData(userId: bigint) {
    // 1. Prisma 메서드 (간단한 조회는 Prisma 우선)
    // await this.tx.user.findUnique(...)

    // 2. Kysely 사용 (Fluent API가 지원하지 않는 영역)
    return await this.tx.$kysely
      .selectFrom('users')
      .innerJoin('wallets', 'wallets.userId', 'users.id')
      .select(['users.email', 'wallets.balance'])
      .where('users.id', '=', userId)
      .execute();
  }
}
```

### 2. Type Safety
- `packages/database/src/kysely-types.ts`에 정의된 `DB` 타입을 자동으로 참조합니다.
- 테이블명, 컬럼명 자동 완성 및 타입 추론을 적극 활용하십시오.
- `CamelCasePlugin`이 적용되어 있으므로 DB의 `snake_case` 컬럼은 코드에서 `camelCase`로 변환되어 반환됩니다.

### 3. Transaction Management
- 별도의 Kysely 트랜잭션 관리가 필요 없습니다.
- `@Transactional()` 데코레이터나 `cls.run()` 내에서 `this.tx`를 사용하면 Prisma와 Kysely 쿼리가 동일한 트랜잭션 내에서 실행됩니다.
- **주의:** `PrismaService`를 직접 주입받아 사용하지 마십시오. 항상 `@InjectTransaction()`을 사용하여 트랜잭션 컨텍스트를 유지해야 합니다.

### 4. Integration Details
- **Prisma Extension:** `prisma-extension-kysely`를 사용하여 Prisma Client를 확장했습니다.
- **Connection Sharing:** Prisma의 내부 엔진(Query Engine)을 통해 쿼리가 실행되므로 별도의 DB 연결 풀을 생성하지 않습니다.
- **Configuration:** `PrismaService`의 `createExtendedClient` 메서드에서 Kysely 인스턴스가 설정됩니다.
