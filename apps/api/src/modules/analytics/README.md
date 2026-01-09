# Analytics Module

Analytics 모듈은 사용자의 모든 주요 활동(입출금, 게임, 보너스 등)을 시간 단위로 집계하고 분석 데이터를 제공하는 모듈입니다.

## 1. 주요 기능
- **시간별 활동 집계 (Hourly Aggregation)**: 사용자의 활동을 1시간 단위로 세분화하여 기록합니다.
- **주요 경제 지표 추적**:
  - 입금/출금 합계 및 횟수
  - 베팅액, 윈금액, GGR(Gross Gaming Revenue), Net Win
  - 게임 카테고리별(Slot, Live 등) 상세 통계
  - 보너스 지급, 사용, 현금 전환 내역
  - 콤프(포인트) 적립 내역
- **잔액 흐름 스냅샷**: 시간대별 시작 잔액과 종료 잔액을 추적하여 자금 흐름을 파악합니다.
- **비동기 처리 (Performance)**: 메인 비즈니스 로직의 성능에 영향을 주지 않도록 BullMQ를 사용하여 모든 집계 작업을 비동기로 처리합니다.
- **통계 API**: 유저용 기간별/집계 통계와 관리자용 유저 상세 통계 API를 제공합니다.

## 2. 사용 방법 (Usage)

타 모듈에서 Analytics 모듈에 데이터를 기록할 때는 `AnalyticsQueueService`를 주입받아 사용합니다. 모든 메서드는 비동기로 동작하며 큐에 작업을 추가합니다.

### 의존성 주입
```typescript
constructor(
    private readonly analyticsQueue: AnalyticsQueueService
) {}
```

### 주요 메서드 호출 예시
- **입금 기록**: `await this.analyticsQueue.enqueueDeposit({ userId, currency, amount });`
- **출금 기록**: `await this.analyticsQueue.enqueueWithdraw({ userId, currency, amount });`
- **게임 결과 기록**: `await this.analyticsQueue.enqueueGame({ userId, currency, betAmount, winAmount, category });`
- **보너스 변동 기록**: `await this.analyticsQueue.enqueueBonus({ userId, currency, givenAmount, usedAmount, convertedAmount });`
- **콤프 적립 기록**: `await this.analyticsQueue.enqueueComp({ userId, currency, earnedAmount });`

## 3. 활용 가이드 (Where to Use)

이 모듈은 자금의 흐름이나 유저의 활동이 확정되는 시점에 호출해야 합니다.

1.  **Payment 모듈**:
    *   입금 요청이 **최종 승인/완료**된 시점
    *   출금 요청이 **최종 승인/지급**된 시점
2.  **Game 모듈**:
    *   게임 라운드가 종료되어 **베팅과 당첨금이 확정**된 시점
3.  **Bonus/Event 모듈**:
    *   유저에게 **보너스가 지급**되거나, 보너스를 사용하여 **베팅**했을 때
    *   보너스 조건이 충족되어 **현금으로 전환**되었을 때
4.  **Comp/Loyalty 모듈**:
    *   베팅이나 이벤트를 통해 **포인트(Comp)가 적립**된 시점

---
**주의**: Analytics 모듈은 단순 기록용이므로, 여기서 발생하는 에러가 메인 비즈니스 로직(예: 실제 입금 처리)을 중단시키지 않도록 `AnalyticsQueueService` 내부에서 예외 처리가 되어 있습니다.
