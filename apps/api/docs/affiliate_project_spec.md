# 온라인 소셜 카지노 어플리에이트 시스템 기능 명세서 (업데이트 버전 - 2025.12 기준)

## 1. 프로젝트 개요
* **목적:** 고성능 어플리에이트(파트너)를 유치하고, 피추천인(referred player)의 실제 기여 수익에 기반한 공정하고 지속 가능한 보상 시스템 구축.
* **모델:** 기본은 단일 단계(Single-tier) 직접 추천 구조. 향후 Sub-Affiliate(2-tier) 확장 가능성 고려.
* **핵심 특징:**
  - 베팅 금액 기반 Bet Share 모델 채택 (단순하고 투명한 구조).
  - Hybrid 옵션(CPA + Bet Share) 지원으로 다양한 마케팅 채널 대응.
  - Tiered Commission Rate (누적 성과에 따라 요율 자동 상향).
  - 최대 20개 레퍼럴 링크 생성 + Sub-ID 트래킹 지원.
  - 실시간 정산, 투명한 대시보드, 강력한 안티-프라우드 시스템.

---

## 2. 커미션 산정 로직 (Commission Logic)

### 2.1 기본 모델: Bet Share
피추천인의 베팅이 종료될 때마다 아래 공식으로 커미션이 즉시 계산됩니다.

$$Commission = Wager\ Amount \times Commission\ Rate$$

- **Wager Amount** (베팅 금액):  
  `Wager Amount = GameRound.totalBetAmountInWalletCurrency`  
  (게임 라운드에서 실제 베팅된 금액 기준)

- **Commission Rate**: 어플리에이트 티어에 따라 0.5% ~ 2.0% (기본 1.0%)
  - 티어별 기본 요율이 자동으로 적용되지만, 관리자가 개별 어플리에이트의 요율을 수동으로 조절할 수 있습니다.
  - 수동 조절된 요율이 있으면 해당 요율이 우선 적용됩니다.

**예시:**
- 베팅 금액: $100
- 적용 요율: 1.0%
- 커미션: $100 × 0.01 = $1.00

### 2.2 옵션 모델: Hybrid (CPA + Bet Share)
관리자가 개별 어플리에이트에게 설정 가능
- **CPA (Cost Per Acquisition)**: 피추천인 가입 + 최소 wagering 조건 충족 시 고정 금액 지급 (예: $50 ~ $200)
- **Bet Share**: 위 기본 모델과 동일 (CPA 지급 후에도 지속 적용 가능)

### 2.3 Tiered Commission Rate (티어표)
| 티어       | 조건 (월간 총 베팅 금액 기준) | Bet Share Rate | 비고                  |
|------------|-------------------------------|----------------|-----------------------|
| Bronze     | $0 ~ $50,000                  | 0.5%           | 기본                  |
| Silver     | $50,001 ~ $200,000            | 0.75%          |                       |
| Gold       | $200,001 ~ $500,000           | 1.0%           |                       |
| Platinum   | $500,001 ~ $1,000,000         | 1.5%           |                       |
| Diamond    | $1,000,001 이상                | 2.0%           | 전용 매니저 배정 가능 |

**참고:** 티어 조건은 월간 총 베팅 금액(Total Wager Amount) 기준으로 계산됩니다.

### 2.4 Negative Carryover 정책
- **None**: 월간 손실은 다음 달로 이월되지 않음 (어플리에이트 신뢰도 유지).

---

## 3. 주요 기능 요구사항

### 3.1 어플리에이트 대시보드 (User Side)
* **링크 관리 (Link Management):**
  - 고유 레퍼럴 URL 및 코드 자동 생성.
  - **생성 제한:** 인당 최대 20개 (현재 n/20 표시).
  - **Sub-ID 지원:** 하나의 링크에 ?sub=youtube, ?sub=twitter 등 추가 가능 (채널별 성과 분석).
  - 라벨링 기능 (예: "유튜브 메인", "트위치 스트리밍").
* **실시간 성과 리포트:**
  - 누적 가입자 수 / 활성 유저 수 / 총 베팅 금액 추이 그래프.
  - 링크별 + Sub-ID별 상세 통계 (클릭수, 가입수, wagering, commission).
  - 게임 카테고리별 breakdown (슬롯, 라이브, 오리지널 등).
* **수익 정산:**
  - **Pending Balance** (당월 발생, 아직 정산 전) / **Available Balance** (출금 가능).
  - 최소 출금액 $100 설정.
  - **Claim 버튼**으로 즉시 게임 지갑 또는 크립토 월렛으로 전환.

### 3.2 관리자 시스템 (Admin Side)
* **티어 및 요율 관리:** 
  - 어플리에이트별 티어 확인 및 수동 조정 (특별 계약 시 상향).
  - **커미션 요율 수동 조절:** 티어별 기본 요율과 무관하게 개별 어플리에이트의 커미션 요율을 수동으로 설정 가능 (예: 특별 계약, 성과 보너스 등).
  - 수동 조절 이력 추적 (누가, 언제 설정했는지 기록).
* **Hybrid 모델 설정:** 특정 어플리에이트에게 CPA 금액 및 조건 설정.
* **프라우드 모니터링 대시보드:**
  - 비정상 conversion rate, 동일 IP/디바이스 셀프 추천 감지.
  - Bonus abuse collusion 플래그.
  - 수동 보류/차단 기능.
* **마케팅 자료 제공:** 배너, 랜딩 페이지 템플릿 관리.

---

## 4. API 라우팅 명세 (API Endpoints)

### 4.1 링크 관리 API
| Method | Endpoint                          | 설명                          | 비고                          |
|--------|-----------------------------------|-------------------------------|-------------------------------|
| `GET`  | `/api/v1/affiliate/links`         | 생성된 링크 목록 조회         | 현재 생성 개수 포함           |
| `POST` | `/api/v1/affiliate/links`         | 신규 레퍼럴 링크 생성         | 20개 제한 + Sub-ID 지원       |
| `PATCH`| `/api/v1/affiliate/links/{id}`    | 라벨 또는 활성 상태 수정      |                               |
| `DELETE`| `/api/v1/affiliate/links/{id}`   | 링크 삭제 및 코드 무효화      |                               |

### 4.2 통계 및 수익 API
| Method | Endpoint                              | 설명                                 | 비고                              |
|--------|---------------------------------------|--------------------------------------|-----------------------------------|
| `GET`  | `/api/v1/affiliate/summary`           | 대시보드 요약 (총 베팅 금액, 티어 등)  |                                   |
| `GET`  | `/api/v1/affiliate/stats/links`       | 링크별 + Sub-ID별 성과 리스트        | pagination, filter 지원           |
| `GET`  | `/api/v1/affiliate/logs`              | 커미션 발생 상세 로그                | date_range, link_id 필터          |
| `GET`  | `/api/v1/affiliate/tiers`             | 현재 티어 및 다음 티어 조건 조회     |                                   |

### 4.3 자산 및 정산 API
| Method | Endpoint                          | 설명                                | 비고                              |
|--------|-----------------------------------|-------------------------------------|-----------------------------------|
| `GET`  | `/api/v1/affiliate/balance`       | Pending / Available 잔액 조회       |                                   |
| `POST` | `/api/v1/affiliate/claim`         | Available 금액 게임 지갑으로 전환   | 최소 $100 체크                    |
| `POST` | `/api/v1/affiliate/withdraw`      | 크립토 출금 요청 (선택적)           | KYC 필요 시 hold                  |

### 4.4 내부 처리 API (Internal / Webhook)
| Method | Endpoint                          | 설명                                      | 비고                              |
|--------|-----------------------------------|-------------------------------------------|-----------------------------------|
| `POST` | `/api/v1/internal/affiliate/calculate` | 베팅 종료 시 커미션 계산 및 Ledger 저장   | 게임 엔진 → affiliate 엔진 호출   |

---

## 5. 데이터베이스 설계 (Prisma 기반 요약)

```prisma
model AffiliateLink {
  id          String   @id @default(uuid())
  userId      String   // affiliate
  code        String   @unique
  label       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  referrals   Referral[]
  user        User     @relation(fields: [userId], references: [id])
  @@index([userId])
  // 20개 제한은 서비스 레이어에서 COUNT(*)로 체크
}

model Referral {
  id            String   @id @default(uuid())
  affiliateId   String
  linkId        String
  subUserId     String   // referred player
  subId         String?  // 채널 트래킹용
  joinedAt      DateTime @default(now())
  cookieExpires DateTime // 30일 후 만료

  affiliate     User     @relation("Affiliate", fields: [affiliateId], references: [id])
  link          AffiliateLink @relation(fields: [linkId], references: [id])
  subUser       User     @relation("Referred", fields: [subUserId], references: [id])
}

model CommissionLedger {
  id              String   @id @default(uuid())
  affiliateId     String
  subUserId       String
  wagerAmount     Decimal  // 베팅 금액
  winAmount       Decimal? // 당첨 금액 (참고용, 계산에 불필요)
  commission      Decimal  // = wagerAmount * rateApplied
  rateApplied     Float    // 적용된 요율 (예: 0.01 = 1%)
  status          CommissionStatus @default(PENDING) // PENDING, AVAILABLE, CLAIMED
  gameCategory    String?
  createdAt       DateTime @default(now())
}

model AffiliateTier {
  id          String   @id @default(uuid())
  affiliateId String   @unique
  
  // 티어 정보
  tier        AffiliateTierLevel @default(BRONZE)
  
  // 요율 정보
  baseRate    Decimal  // 티어별 기본 요율 (자동 계산용)
  customRate  Decimal? // 관리자가 수동 설정한 요율 (null이면 baseRate 사용)
  isCustomRate Boolean @default(false) // 수동 조절 여부
  
  // 월간 집계 (티어 계산용)
  monthlyWagerAmount Decimal @default(0) // 월간 총 베팅 금액 (cron reset)
  
  // 수동 조절 이력 (선택적)
  customRateSetBy   String?  // 수동 조절한 관리자 ID
  customRateSetAt   DateTime? // 수동 조절 일시
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum AffiliateTierLevel { BRONZE SILVER GOLD PLATINUM DIAMOND }
enum CommissionStatus { PENDING AVAILABLE CLAIMED FRAUD_HOLD }