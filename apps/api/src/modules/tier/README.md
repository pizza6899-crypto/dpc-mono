# Tier Module Architecture

DPC의 **Tier Module**은 높은 복잡도를 가진 티어 시스템을 체계적으로 관리하기 위해 **4-Submodules Architecture**를 채택하고 있습니다.
각 서브 모듈은 명확한 책임(Single Responsibility)을 가지며, 상호 의존성을 최소화하는 방향으로 설계되었습니다.

---

## 🏛️ Architecture Overview

티어 시스템은 다음 4개의 서브 모듈로 구성됩니다.

| 서브 모듈 | 역할 요약 | 핵심 키워드 | 담당 영역 |
| :--- | :--- | :--- | :--- |
| **1. Definitions** | **기준 정보 관리** | `Definition`, `Policy`, `Rule` | 티어 등급 정의, 요구 실적(Requirements), 혜택(Benefits) 설정 |
| **2. Profile** | **유저 상태 관리** | `State`, `Status`, `UserTier` | 유저의 현재 티어, 누적 실적, 유효 기간 등 "상태" 저장 및 조회 |
| **3. Evaluator** | **판정 및 엔진** | `Engine`, `Calculate`, `Promotion` | 승급/강등 판정, 실적 계산, 유예 기간 부여 등 "비즈니스 로직" 수행 |
| **4. Audit** | **감사 및 이력** | `History`, `Log`, `Stats` | 티어 변경 이력 기록, 배치 심사 로그, 통계 데이터 집계 |

---

## 🚦 Traffic Control (When to use What)

기능을 구현할 때 어떤 모듈을 수정하거나 호출해야 할지 결정하는 가이드입니다.

### 🟢 Use **Evaluator** When...
- 유저의 게임 실적(배팅액, 입금액)을 누적해야 할 때
- 유저를 승급시키거나 강등 여부를 판단해야 할 때
- **(주의)**: Evaluator는 로직을 수행할 뿐, 최종 상태 저장은 Profile 모듈의 Repository를 통해 수행합니다.

### 🟢 Use **Profile** When...
- 특정 유저의 현재 티어 정보를 조회해야 할 때 (`My Page`, `Admin User Detail`)
- 유저의 티어 정보를 강제로 수정해야 할 때 (관리자 기능)
- 유저 생성 시 초기 티어를 할당해야 할 때

### 🟢 Use **Definitions** When...
- 새로운 티어 등급을 만들거나 기존 혜택 수치를 조정해야 할 때
- 티어 목록을 보여줘야 할 때 (UI, Admin)

### 🟢 Use **Audit** When...
- "이 유저가 언제 승급했지?" 이력을 조회해야 할 때
- 전체 티어 분포 통계를 보고 싶을 때
- 지난 밤 배치 작업이 성공했는지 로그를 확인해야 할 때

---

## 🔄 Data Flow Example

**Scenario: 유저가 $1,000 배팅을 하여 승급 조건을 달성함**

1.  **Input**: 외부 게임 서버로부터 `BettingEvent` 발생
2.  **Evaluator (`AccumulateRollingService`)**:
    -   `Profile`에서 유저 현재 상태 조회 (`UserTier`)
    -   `Definitions`에서 승급 기준 조회 (`Tier`)
    -   실적 누적 후 승급 조건 충족 판정 (`PromotionPolicy`)
3.  **Action**:
    -   승급이 결정되면 `Profile`을 통해 유저 티어 정보 업데이트
    -   변경 사실을 `Audit`에 기록 (`TierHistory`)

---

## ⛔️ Anti-Patterns (하지 말아야 할 것)

1.  **Circular Dependency**:
    -   `Definitions`는 다른 모듈을 참조하지 않아야 합니다. (가장 기반이 되는 모듈)
    -   `Audit`는 비즈니스 로직(`Evaluator`)에 영향을 주면 안 됩니다.
2.  **Direct Database Access**:
    -   `Evaluator`가 직접 `UserTier` 테이블에 `UPDATE` 쿼리를 날리는 것보다, 도메인 메서드를 통해 상태를 변경하고 저장해야 합니다.
3.  **Mixed Responsibilities**:
    -   `Profile` 서비스 안에서 "승급 계산 로직"을 짜지 마십시오. 그건 `Evaluator`의 역할입니다.
