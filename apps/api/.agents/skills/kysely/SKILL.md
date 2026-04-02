---
name: kysely_implementation
description: Kysely Implementation Expert (Prisma Integration & Atomic Updates)
---

# Skill: Kysely Implementation Expert

## 🎯 Role & Context
이 스킬은 Prisma와 통합된 **Kysely**를 사용하여 복잡한 원자적 업데이트(Atomic Updates)와 고성능 쿼리를 작성하는 표준 가이드를 제공합니다. 특히 **동시성 문제가 발생하기 쉬운 통계/지갑 로직**에서 데이터 무결성을 보장하기 위한 **Atomic Upsert** 패턴에 집중합니다.

## 📁 Critical Locations
- **DB Types (Generated):** `apps/api/src/generated/kysely/kysely-types.ts` (모든 DB 컬럼은 `snake_case`로 정의됨)
- **Repo Implementation:** `apps/api/src/modules/wallet/infrastructure/user-wallet-stats.repository.ts` (Best Practice Reference)

## 🛠 Top Priority: Atomic Upsert Pattern (The "Wallet Pattern")
동시성 요청이 많은 카운터, 잔액, 통계 업데이트 시 **Race Condition**을 방지하기 위해 반드시 이 패턴을 사용해야 합니다. Application Level Lock 없이 DB 레벨에서 원자성을 보장합니다.

### ✅ 구현 원칙
1. **Insert ... On Conflict ... Do Update Set** 구문을 사용합니다.
2. 기존 값을 읽어와서 더하는 것이 아니라, DB 상의 현재 값에 더하는 방식(`column + value`)을 사용합니다.
3. Kysely의 `sql` 템플릿 리터럴을 활용하여 수식과 SQL 함수(`GREATEST` 등)를 적용합니다.

### 📝 Code Snippet (Recommended)
```typescript
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module'; // 트랜잭션 타입
import { sql } from 'kysely';

@Injectable()
export class UserStatsRepository {
    constructor(
        // nestjs-cls 트랜잭션 주입 (Prisma & Kysely 공유)
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async increaseStats(userId: bigint, dto: UpdateStatsDto): Promise<void> {
        const { betAmount, winAmount } = dto;
        const now = new Date();
        
        // 1. BigInt 및 Null 처리
        // Kysely Values에는 문자열로 변환하여 전달 (설정 및 드라이버에 따라 다를 수 있으나 안전한 방식)
        const betStr = betAmount?.toString() ?? '0';
        const winStr = winAmount?.toString() ?? '0';
        const hasBet = betAmount > 0;

        // 2. Kysely Query Builder 실행
        await this.tx.$kysely
            .insertInto('user_wallet_total_stats') // 테이블명 (snake_case)
            .values({
                // 컬럼명 (snake_case) : 값
                user_id: userId.toString(),
                total_bet_amount: betStr,
                total_win_amount: winStr,
                max_win_amount: winStr,
                total_bet_count: hasBet ? '1' : '0',
                last_bet_at: hasBet ? now : null,
                updated_at: now,
            })
            .onConflict((oc) => oc
                // Uniqe Constraints 컬럼 지정
                .columns(['user_id']) 
                .doUpdateSet((eb) => ({
                    // 3. Atomic Update Logic
                    // 기존 값에 Delta를 더함 (Read-Modify-Write 방지)
                    total_bet_amount: sql`user_wallet_total_stats.total_bet_amount + ${betStr}`,
                    total_win_amount: sql`user_wallet_total_stats.total_win_amount + ${winStr}`,
                    
                    // 4. SQL Functions 활용 (예: 최대값 갱신)
                    max_win_amount: sql`GREATEST(user_wallet_total_stats.max_win_amount, ${winStr})`,
                    
                    // 5. 조건부 카운팅
                    total_bet_count: sql`user_wallet_total_stats.total_bet_count + ${hasBet ? '1' : '0'}`,
                    
                    // 6. 조건부 타임스탬프 갱신
                    // 조건이 맞으면 새 시간(now), 아니면 기존 시간 유지
                    last_bet_at: hasBet ? now : sql`user_wallet_total_stats.last_bet_at`,
                    
                    updated_at: now,
                }))
            )
            .execute();
    }
}
```

## ⚠️ Type Handling & Conventions

### 1. Naming Convention (Snake vs Camel)
- **Write (Insert/Update):** `values()` 및 `doUpdateSet` 내에서는 **DB 컬럼명(snake_case)**을 그대로 사용해야 하는 경우가 많습니다. (Generated Types 확인 필요)
- **Read (Select):** `CamelCasePlugin`이 적용되어 있다면 결과값은 `camelCase`로 반환되지만, 쿼리 작성 시 테이블/컬럼 참조는 주로 `snake_case`를 사용합니다.
- **Reference:** `apps/api/src/modules/wallet/infrastructure/user-wallet-stats.repository.ts` 파일을 기준으로 작성하십시오.

### 2. BigInt Handling
- `BigInt` 타입의 값을 DB에 넣을 때는 `.toString()`으로 변환하여 전달하는 패턴을 따릅니다.
- 쿼리 내에서 숫자 연산이 필요할 경우 `sql` 템플릿 태그 내에서 `${val}` 형태로 주입하면 파라미터 바인딩 처리되므로 안전합니다.

### 3. Null & Default Values
- `undefined`나 `null`이 될 수 있는 값은 `?? '0'` 처리를 통해 명시적인 기본값을 할당하여 SQL 에러를 방지하십시오.

## 🔄 Transaction Integration
`nestjs-cls`와 `prisma-extension-kysely` 덕분에 별도의 트랜잭션 관리 코드가 필요 없습니다.
- `@InjectTransaction()`으로 주입받은 `this.tx`는 자동으로 현재 트랜잭션 컨텍스트를 공유합니다.
- `this.tx.$kysely`를 호출하면 동일한 트랜잭션 내에서 Kysely 쿼리가 실행됩니다.
