# Skill: Kysely Implementation Expert (Prisma Integration)

## 🎯 Role & Context
이 스킬은 Prisma를 기반으로 구축된 NestJS 모노레포 환경에서 **Kysely**를 사용하여 Type-safe한 SQL 쿼리를 작성하는 가이드를 제공합니다. `prisma-extension-kysely`를 통해 Prisma Client와 완벽하게 통합되어 있으며, `nestjs-cls`를 통해 트랜잭션 컨텍스트를 안전하게 공유합니다.

### 언제 Kysely를 사용하나요?
- 단순 CRUD는 **Prisma** 메서드(`findMany`, `create`, `update` 등)를 사용합니다.
- 복잡한 조인, 집계, 윈도우 함수, 서브쿼리 등 SQL의 강력한 기능이 필요한 경우 **Kysely**를 사용합니다.

## 📁 Critical Locations (Paths)
- **Kysely Types:** `packages/database/src/kysely-types.ts`
- **Prisma Service:** `apps/api/src/infrastructure/prisma/prisma.service.ts`
- **Prisma Module:** `apps/api/src/infrastructure/prisma/prisma.module.ts`

## 🛠 Usage Rules

### 1. Repository Implementation Pattern
리포지토리에서는 `nestjs-cls`의 `@InjectTransaction()` 데코레이터를 통해 트랜잭션 객체를 주입받아 사용합니다. 이 `tx` 객체는 `prisma-extension-kysely`가 적용된 상태이므로 `$kysely` 프로퍼티를 통해 Kysely 쿼리 빌더에 접근할 수 있습니다.

**필수 패턴:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module'; // 타입 정의 경로

@Injectable()
export class MyRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction, // 확장된 Prisma Client 타입 (Kysely 포함)
  ) {}

  async findComplexData(userId: bigint) {
    // 1. Prisma 메서드 사용 (단순 조회)
    // await this.tx.user.findUnique(...)

    // 2. Kysely 사용 (복잡한 쿼리)
    // this.tx.$kysely 또는 this.tx.extended.$kysely 사용 (설정에 따름)
    return await this.tx.$kysely
      .selectFrom('users')
      .innerJoin('wallets', 'wallets.user_id', 'users.id')
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