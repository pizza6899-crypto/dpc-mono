# Tier Module (티어 시스템)

## 1. 개요 (Overview)
티어 모듈은 유저의 활동(롤링 실적 등)에 따라 **XP(Experience Point)**를 부여하고, 누적된 XP에 따라 등급(Tier)을 부여하며 이에 따른 혜택(보너스, 요율, 출금 한도 등)을 관리하는 핵심 도메인입니다.
**DDD(Domain-Driven Design)** 원칙에 따라 설계되었으며, `Evaluator`(심사), `Profile`(상태), `Config`(설정), `Audit`(이력/통계)으로 역할이 명확히 분리되어 있습니다.

## 2. 아키텍처 및 구조 (Architecture)

### 디렉토리 구조
- **`config/`**: 티어 레벨 정의, 전역 설정, 다국어 명칭 및 정책 (Metadata & Policy)
- **`profile/`**: 유저별 티어 현황(`UserTier`) 및 개별 커스텀 혜택 관리 (User State)
- **`evaluator/`**: XP 적립 및 승급/강등 판정 로직 (Logic Engine)
- **`audit/`**: 티어 변경 이력(`TierHistory`) 및 시간대별 티어 분포 통계(`TierStats`) 기록 (Audit & Stats)

---

## 3. 핵심 정책 (Core Policies)

### A. XP 적립 및 승급 (XP & Promotion)
승급은 유저의 활동 실적이 발생하는 즉시 **실시간(Real-time)**으로 판정됩니다.

1.  **XP 적립**:
    - 베팅(롤링) 발생 시 `AccumulateUserRollingService`를 통해 USD 거래액을 XP로 환산하여 적립합니다. (환산 비율은 `TierConfig`에서 설정)
2.  **승급 판정**:
    - `statusExp` (현재 등급에서의 승급용 XP) ≥ 목표 티어의 `upgradeExpRequired` 일 경우 즉시 승급합니다.
3.  **주요 특징**:
    - **점프 승급 (Jump Promotion)**: 자격 충족 시 여러 단계를 한 번에 승급할 수 있으며, 건너뛴 중간 티어의 승급 보너스까지 합산하여 지급(PENDING)합니다.
    - **중복 지급 방지**: `maxLevelAchieved`(역대 최고 달성 레벨)을 기록하여, 강등 후 재승급 시에는 이미 수령한 레벨의 보너스를 중복 지급하지 않습니다.
    - **보상 만료**: 승급 보너스는 설정된 기간(`rewardExpiryDays`) 내에 수령하지 않으면 만료됩니다.

### B. 강등 및 유지 (Demotion & Maintenance)
강등 심사는 시스템 부하를 고려하여 **주기적 배치(Scheduled Batch)** 작업으로 수행됩니다.

1.  **평가 주기**: `ROLLING_30_DAYS`, `ROLLING_90_DAYS` 등 티어별 설정된 주기에 따라 `nextEvaluationAt` 시점에 심사합니다.
2.  **심사 상태 흐름 (State Transition)**:
    - **ACTIVE → GRACE**: 유지 조건을 충족하지 못할 경우 즉시 강등되지 않고 '강등 유예 기간'을 부여합니다.
    - **GRACE → MAINTAIN**: 유예 기간 내에 조건을 달성하면 다시 ACTIVE 상태로 복구됩니다.
    - **GRACE → DEMOTE**: 유예 기간 종료 시점에도 조건을 미달하면 강등됩니다.
3.  **Soft Landing & Penalty**:
    - 강등 시, 무조건 1단계 하락이 아니라 **현재 XP로 도달 가능한 최상위 티어**로 이동합니다.
    - 강등된 즉시 재승급하는 어뷰징을 막기 위해, 승급용 XP(`statusExp`)를 강등된 티어의 요구량 한도(Cap)로 조정합니다.

---

## 4. 기술적 구현 및 안전 장치 (Technical Details)

### 동시성 및 분산 처리
- **Advisory Lock**: `LOCK:USER_TIER:{userId}`를 사용하여 실시간 XP 적립과 배치 심사 간의 데이터 경합을 방지합니다.
- **BullMQ**: 대규모 유저 심사 및 통계 집계를 비동기 잡(Job)으로 분산 처리하여 API 응답 성능을 보장합니다.

### 데이터 무결성 및 보안
- **커스텀 오버라이드 (Admin Overrides)**: 특정 VIP 유저에 대해 컴프 요율, 손실백 요율, 출금 한도 등을 티어 기본값 대신 개별 설정할 수 있습니다.
- **통화별 보너스**: 유저의 선호 통화(`preferredRewardCurrency`)에 맞춰 티어별 보너스 금액을 다르게 설정하고 지급할 수 있습니다.
- **다중 출금 한도**: 단순 일일 한도를 넘어 주간/월간 출금 한도를 USD 기준으로 통합 관리하여 리스크를 제어합니다.

---

## 5. 주요 서비스 및 기능

- **`TierStatsAggregationProcessor`**: 매 시간 티어별 유저 분포 및 당일 발생한 보상/XP 총량을 집계합니다.
- **`GetTierDistributionService`**: 어드민 대시보드용 실시간 티어 통계 데이터를 제공합니다.
- **`UserTier.getEffectiveBenefits()`**: 티어 기본 혜택과 관리자 커스텀 설정을 병합하여 유저에게 적용될 최종 혜택을 산출합니다.
