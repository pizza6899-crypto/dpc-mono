# User Stats Module

사용자 통계를 관리하는 모듈입니다.

## 개요

`UserStatsModule`은 사용자의 누적 통계 데이터를 관리합니다. 잔액(`UserBalance`)과 통계(`UserBalanceStats`)를 분리하여 성능 최적화와 확장성을 제공합니다.

## 주요 기능

### UserStatsService

통계 업데이트 및 조회를 위한 전담 서비스입니다.

#### 메서드

##### 1. updateBetWinStats
베팅/승리 통계를 업데이트합니다.

```typescript
await userStatsService.updateBetWinStats(
  tx,
  userId,
  currency,
  betAmount,    // 베팅 금액 (Decimal)
  winAmount,    // 승리 금액 (Decimal)
);
```

##### 2. updateDepositStats
입금 통계를 업데이트합니다.

```typescript
await userStatsService.updateDepositStats(
  tx,
  userId,
  currency,
  amount,       // 입금 금액 (Decimal)
);
```

##### 3. updateWithdrawStats
출금 통계를 업데이트합니다.

```typescript
await userStatsService.updateWithdrawStats(
  tx,
  userId,
  currency,
  amount,       // 출금 금액 (Decimal)
);
```

##### 4. updateBonusStats
보너스 통계를 업데이트합니다.

```typescript
await userStatsService.updateBonusStats(
  tx,
  userId,
  currency,
  amount,       // 보너스 금액 (Decimal)
);
```

##### 5. updateCompEarnedStats
콤프 획득 통계를 업데이트합니다.

```typescript
await userStatsService.updateCompEarnedStats(
  tx,
  userId,
  currency,
  amount,       // 콤프 금액 (Decimal)
);
```

##### 6. updateCompUsedStats
콤프 사용 통계를 업데이트합니다.

```typescript
await userStatsService.updateCompUsedStats(
  tx,
  userId,
  currency,
  amount,       // 사용한 콤프 금액 (Decimal)
);
```

##### 7. updateSettlementStats
정산 통계를 업데이트합니다.

```typescript
await userStatsService.updateSettlementStats(
  tx,
  userId,
  currency,
  fromBet,      // 베팅 정산 금액 (Decimal)
  fromVip,      // VIP 정산 금액 (Decimal)
);
```

##### 8. getStats
사용자의 특정 통화별 통계를 조회합니다.

```typescript
const stats = await userStatsService.getStats(userId, currency);
```

##### 9. getAllStats
사용자의 모든 통화별 통계를 조회합니다.

```typescript
const allStats = await userStatsService.getAllStats(userId);
```

## 사용 예시

### 모듈 임포트

```typescript
@Module({
  imports: [
    UserStatsModule,  // UserStatsModule 추가
    // ... other modules
  ],
  // ...
})
export class YourModule {}
```

### 서비스에서 사용

```typescript
import { UserStatsService } from 'src/modules/user-stats/application/user-stats.service';

@Injectable()
export class YourService {
  constructor(
    private readonly userStatsService: UserStatsService,
  ) {}

  async someMethod() {
    await this.prisma.$transaction(async (tx) => {
      // 1. 잔액 업데이트
      await tx.userBalance.update({
        where: { userId_currency: { userId, currency } },
        data: { mainBalance: { increment: amount } },
      });

      // 2. 통계 업데이트 (같은 트랜잭션)
      await this.userStatsService.updateDepositStats(
        tx,
        userId,
        currency,
        amount,
      );
    });
  }
}
```

## 데이터 모델

### UserBalanceStats

```prisma
model UserBalanceStats {
  userId   String
  currency ExchangeCurrencyCode

  // 누적 통계
  totalDeposit           Decimal @default(0) @db.Decimal(32, 18)
  totalWithdraw          Decimal @default(0) @db.Decimal(32, 18)
  totalBet               Decimal @default(0) @db.Decimal(32, 18)
  totalWin               Decimal @default(0) @db.Decimal(32, 18)
  totalBonus             Decimal @default(0) @db.Decimal(32, 18)
  totalCompEarned        Decimal @default(0) @db.Decimal(32, 18)
  totalCompUsed          Decimal @default(0) @db.Decimal(32, 18)
  totalSettlementFromBet Decimal @default(0) @db.Decimal(32, 18)
  totalSettlementFromVip Decimal @default(0) @db.Decimal(32, 18)

  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@id([userId, currency])
  @@index([userId])
  @@index([currency])
}
```

## 아키텍처 이점

### 1. 성능 최적화
- 잔액 조회 시 통계 필드를 읽지 않아 I/O 감소
- 락 경합 감소 (잔액과 통계가 별도 테이블)

### 2. 코드 재사용성
- 통계 업데이트 로직이 중앙 집중화
- 여러 서비스에서 동일한 메서드 사용

### 3. 일관성
- 통계 업데이트 방식 통일
- 버그 발생 가능성 감소

### 4. 유지보수성
- 통계 필드 변경 시 한 곳만 수정
- 테스트 용이

### 5. 확장성
- 비동기 업데이트 전략 적용 가능
- 별도 분석 시스템으로 이관 용이

## 적용된 모듈

현재 다음 모듈에서 `UserStatsService`를 사용하고 있습니다:

1. **CasinoModule** - 베팅/승리 통계
2. **PaymentModule** - 입금/출금 통계

## 주의사항

1. 모든 통계 업데이트는 **트랜잭션 내부**에서 수행되어야 합니다.
2. `upsert`를 사용하므로 통계 레코드가 없어도 자동 생성됩니다.
3. 통계는 **누적(increment)** 방식으로 업데이트됩니다.

## 향후 확장 계획

1. 비동기 통계 업데이트 (이벤트 기반)
2. 기간별 통계 (`UserBalancePeriodStats`)
3. 통계 집계 배치 작업
4. 통계 분석 API 엔드포인트

