# Tier Module (티어 시스템)

## 1. 개요 (Overview)
티어 모듈은 유저의 활동(입금, 롤링) 실적에 따라 등급(Tier)을 부여하고, 이에 따른 혜택(보너스, 요율 등)을 관리하는 핵심 도메인입니다.
**DDD(Domain-Driven Design)** 원칙에 따라 설계되었으며, `Evaluator`(심사), `Profile`(상태), `Definitions`(설정)으로 역할이 명확히 분리되어 있습니다.

## 2. 아키텍처 및 구조 (Architecture)

### 디렉토리 구조
- **`definitions/`**: 티어 레벨, 설정, 환경 등 메타데이터 및 불변 정책 (Config)
- **`profile/`**: 유저별 티어 현황(`UserTier`) 및 상태 관리 (State)
- **`evaluator/`**: 승급/강등 심사 로직 및 정책 구현 (Brain)
- **`reward/`**: 승급 보너스 지급 및 회수 관련 로직 (Reward)
- **`audit/`**: 이력(`TierHistory`) 및 통계(`TierStats`) 기록 (Log)

---

## 3. 핵심 정책 (Core Policies)

### A. 승급 (Promotion)
승급은 **실시간(Real-time)**으로 이루어지며, 유저의 실적이 발생하는 즉시 트리거됩니다.

1.  **트리거 시점**:
    - 입금 발생 시: `AccumulateUserDepositService`
    - 롤링(베팅) 발생 시: `AccumulateUserRollingService`
2.  **자격 요건**:
    - `statusRollingUsd` (현재 등급에서의 롤링 누적액) ≥ 목표 티어 요구량
    - **AND** `lifetimeDepositUsd` (평생 입금액) ≥ 목표 티어 요구량
3.  **주요 특징**:
    - **점프 승급 (Jump Promotion)**: 자격 충족 시 여러 단계를 한 번에 승급할 수 있으며(예: Bronze → Gold), 건너뛴 중간 티어의 승급 보너스까지 합산하여 지급합니다.
    - **중복 지급 방지**: `maxLevelAchieved`(최고 달성 레벨)을 기록하여, 강등 후 재승급 시에는 보너스를 중복 지급하지 않습니다.
    - **보상 만료**: 승급 보너스는 설정된 기간(`rewardExpiryDays`) 내에 수령하지 않으면 만료됩니다.

### B. 강등 (Demotion)
강등은 시스템 부하를 고려하여 **주기적 배치(Scheduled Batch)** 작업으로 수행됩니다.

1.  **트리거 시점**: `EvaluateUserTierService` 실행 시 (주로 일 1회 배치).
2.  **심사 로직 (Maintenance Check)**:
    - 현재 주기 실적(`currentPeriodRollingUsd`) < 유지 요구량(`maintainRollingRequiredUsd`) 일 경우 심사 대상이 됩니다.
3.  **상태 흐름 (State Transition)**:
    - **ACTIVE → GRACE**: 실적 미달 시 즉시 강등되지 않고 '유예 기간'을 부여합니다.
    - **GRACE → MAINTAIN**: 유예 기간 내에 실적을 달성하면 정상 상태로 복구됩니다.
    - **GRACE → DEMOTE**: 유예 기간이 종료될 때까지 실적을 못 채우면 강등됩니다.
4.  **Soft Landing & Penalty**:
    - 강등 시, 무조건 1단계 하락이 아니라 **현재보다 낮은 활성 티어 중 가장 높은 티어**로 이동합니다.
    - 강등된 즉시 재승급하는 것을 막기 위해, 승급용 실적(`statusRollingUsd`)을 강등된 티어의 승급 요구량 한도(Cap)로 삭감합니다.

---

## 4. 기술적 구현 및 안전 장치 (Technical Details)

### 동시성 제어 (Concurrency Control)
시스템 안정성을 위해 **Advisory Lock**을 적극적으로 사용합니다.

1.  **`LOCK:USER_TIER:{userId}`**: 실시간 실적 누적(Accumulate)과 정기 심사(Evaluate) 간의 경합 방지.
2.  **`LOCK:TIER_REWARD:{userId}`**: 보상 수령(Claim) 시 중복 클릭 및 동시 요청 방지.

### 데이터 무결성 (Integrity)
- **도메인 메서드 사용**: 모든 상태 변경은 `UserTier` 엔티티 내부의 도메인 메서드(`upgradeTier` 등)를 통해 이루어집니다. 이를 통해 상태, 레벨, 날짜 데이터의 일관성을 보장합니다.
- **자금 흐름 추적 (Audit)**: 보상 수령 시 생성되는 **지갑 트랜잭션**은 `tier_upgrade_reward.id`를 `referenceId`로 기록하여, 언제든 보상 내역과 지금 내역을 1:1로 대조할 수 있습니다.

### 운영 유연성 (Operations)
- **LOCKED 상태**: 특정 유저의 등급을 관리자가 고정(`LOCKED`)하면, 자동 심사 로직에서 제외되어 시스템이 임의로 승급/강등시키지 않습니다. (VIP Care 목적)
- **Config**: 시스템 전체의 승급/강등/보너스 기능을 `TierConfig`를 통해 마스터 스위치로 On/Off 할 수 있습니다.

---

## 5. 향후 개선 과제 (TODO)
- [ ] **캐싱 적용**: `AccumulateService`에서 `tierRepository.findAll()` 호출 빈도가 매우 높습니다(매 스핀마다 호출). Redis 등을 활용한 티어 정의 캐싱이 필요합니다.
