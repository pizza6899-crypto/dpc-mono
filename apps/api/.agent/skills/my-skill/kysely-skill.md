---
name: kysely_implementation
description: Guide for implementing Kysely for complex queries in NestJS using Prisma integration
---

# Skill: Kysely Implementation Expert (Prisma Integration)

## 🎯 Role & Context
이 스킬은 Prisma를 기반으로 구축된 NestJS 모노레포 환경에서 **Kysely**를 사용하여 Type-safe한 SQL 쿼리를 작성하는 전문가 역할을 수행합니다. 단순 CRUD는 Prisma를 사용하고, 복잡한 쿼리나 성능 최적화가 필요한 경우 Kysely를 사용합니다.

## 📁 Critical Locations (Paths)
- **Prisma Schema:** `packages/database/prisma/schema/common.prisma` (또는 해당 도메인 prisma 파일)
- **Kysely Types (Generated):** `packages/database/src/generated/kysely/types.ts` (generator 설정에 따라 다름)
- **Package Name:** `@repo/database`

## 🛠 Usage Rules

### 1. Prerequisites (Schema Setup)
`prisma-kysely` 제너레이터가 설정되어 있어야 합니다.
```prisma
generator kysely {
  provider = "prisma-kysely"
  output   = "../src/generated/kysely"
  fileName = "types.ts"
}
```

### 2. Type Reference
- 반드시 `prisma-kysely`를 통해 생성된 `DB` 인터페이스를 사용해야 합니다.
- 임포트 경로: `import { DB } from '@repo/database/src/generated/kysely/types';`

### 3. Dependency Injection (NestJS)
- Kysely 인스턴스는 `@Inject(KYSELY_INSTANCE)` 토큰을 사용하여 주입받습니다. (혹은 별도 정의된 Provider Token)
- 예시:
  ```typescript
  constructor(
    @Inject(KYSELY_INSTANCE) private readonly db: Kysely<DB>
  ) {}
  ```