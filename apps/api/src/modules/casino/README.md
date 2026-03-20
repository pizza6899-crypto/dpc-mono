# 🎰 Casino Module

카지노 게임 통합, 게임 세션 관리, 트랜잭션 처리 및 후처리 로직을 담당하는 핵심 모듈입니다.  
다양한 게임 공급사(Aggregator)와의 연동을 추상화하여 일관된 인터페이스를 제공합니다.

## 🏗 Architecture Overview

Casino 모듈은 헥사고날 아키텍처 원칙을 따르며, 크게 다음과 같은 서브 컴포넌트로 구성됩니다.

| Component | Responsibility | Path |
| :--- | :--- | :--- |
| **Core Application** | 게임 실행, 잔액 조회, 베팅/당첨 처리 등 핵심 유즈케이스 구현 | `application/` |
| **Providers** | 외부 공급사(Whitecliff, DCS 등)별 API 클라이언트 및 콜백 핸들러 구현 | `providers/` |
| **Game Catalog** | 게임 목록, 카테고리, 제공사(Provider) 정보 관리 및 동기화 | `game-catalog/` |
| **Game Session** | 게임 실행 세션 생성, 토큰 검증, 유저 매핑 | `game-session/` |
| **Aggregator** | 공급사별 공통 인터페이스 정의 및 구현체 매핑 | `aggregator/` |

---

## 🔄 Core Workflows

### 1. Game Launch (게임 실행)
유저가 게임 실행 요청 시의 흐름입니다.
1. `LaunchGameService` 호출.
2. **Policy Check**: `CasinoLaunchPolicy`를 통해 유저 상태(차단, 점검 등) 및 게임 상태 확인.
3. **Session Create**: `GameSessionService`를 통해 고유 토큰 발급 및 세션 DB 저장.
4. **API Request**: 선택된 Aggregator(예: Whitecliff)의 API를 호출하여 게임 실행 URL 획득.
5. **Redirect**: 클라이언트에 게임 URL 반환.

### 2. Transaction Processing (베팅/당첨)
게임 플레이 중 공급사로부터 콜백이 들어왔을 때의 흐름입니다.
1. **Callback**: `ProviderCallbackController` (예: `WhitecliffCallbackController`)가 요청 수신.
2. **Validation**: 서명(Signature) 검증, 세션 유효성 확인, 중복 요청 방지.
3. **Processing**: `ProcessCasinoBetService` 또는 `ProcessCasinoCreditService` 호출.
    - **Wallet**: `WalletModule`을 통해 유저 잔액 차감(Debit) 또는 지급(Credit).
    - **Persistence**: `GameRoundModule`(`ResolveGameRoundService`)을 통해 게임 라운드 및 트랜잭션 기록 저장.
4. **Response**: 공급사에 처리 결과 및 현재 잔액(Balance) 반환.
5. **Async Post-Process**: 트랜잭션 성공 시 `CasinoQueueService`를 통해 후처리 작업 큐잉 (Fire-and-Forget).

### 3. Game Post-Process (비동기 후처리)
베팅/게임 종료 후 실행되는 백그라운드 작업입니다 (`CasinoGamePostProcessService`).
- **Trigger**: `GamePostProcessProcessor` (BullMQ)에 의해 실행.
- **Wagering**: `WageringModule`을 호출하여 롤링 요구량(Turnover) 차감.
- **Comp**: `CompModule`을 호출하여 콤프(포인트) 적립.
- **Tier**: `TierEvaluatorModule`(`AccumulateRollingService`)을 호출하여 티어 실적 누적 및 승급 심사.

---

## 🔌 Integration Points

이 모듈은 다수의 도메인 모듈과 긴밀하게 연동됩니다.

- **Wallet Module (`WalletModule`)**: 유저의 입출금 및 잔액 관리를 위해 필수적입니다.
- **Tier Module (`TierEvaluatorModule`)**: 게임 실적을 티어 점수에 반영합니다.
- **Comp Module (`CompModule`)**: 베팅 금액에 따른 포인트를 적립합니다.
- **Wagering Module (`WageringModule`)**: 보너스 출금 조건을 위한 롤링 요구량을 관리합니다.
- **Exchange Module (`ExchangeModule`)**: 다중 통화 지원을 위한 환율 계산을 수행합니다.

---

## 📂 Directory Structure

```graphql
src/modules/casino/
├── aggregator/         # 공급사 인터페이스 및 어댑터
├── application/        # 핵심 비즈니스 로직 (Use Cases)
├── domain/             # 도메인 정책 (Policy) 및 엔티티
├── game-catalog/       # 게임/카테고리 관리 서브 모듈
├── game-session/       # 세션 관리 서브 모듈
├── infrastructure/     # DB Repository, Queue Processors, Mappers
├── ports/              # Port Interface 정의
└── providers/          # 공급사별 구현체 (Whitecliff, DCS)
```

## 🚀 Adding a New Provider
새로운 게임 공급사를 추가하려면 다음 단계를 따르십시오.

1. `providers/` 아래에 공급사명 폴더 생성 (예: `evolution/`).
2. `Aggregator` 인터페이스를 구현하는 API Service 작성.
3. 공급사 규격에 맞는 `CallbackController` 및 `Dto` 구현.
4. `AggregatorFactory`에 새 공급사 등록.
5. `CasinoModule`에 해당 모듈 Import.
