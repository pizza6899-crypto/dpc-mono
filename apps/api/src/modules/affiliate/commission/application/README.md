# Commission Application Services 설계 문서

## 개요

이 문서는 Commission 모듈의 Application 레이어(Use Case 서비스) 구현을 위한 설계 문서입니다.

## 필요한 Use Case 서비스 목록

### 1. 조회 계열 (Find*)

#### 1.1 FindCommissionByIdService
- **책임**: 커미션 UID 또는 ID로 조회
- **의존성**:
  - `AffiliateCommissionRepositoryPort`
- **파라미터**:
  - `uid?: string` (비즈니스용)
  - `id?: bigint` (어드민용)
- **반환**: `AffiliateCommission | null`

#### 1.2 FindCommissionsService
- **책임**: 어필리에이트의 커미션 목록 조회 (필터링, 페이지네이션)
- **의존성**:
  - `AffiliateCommissionRepositoryPort`
- **파라미터**:
  - `affiliateId: string`
  - `options?: { status?, currency?, startDate?, endDate?, limit?, offset? }`
- **반환**: `AffiliateCommission[]`

#### 1.3 GetWalletBalanceService
- **책임**: 어필리에이트의 월렛 잔액 조회
- **의존성**:
  - `AffiliateWalletRepositoryPort`
- **파라미터**:
  - `affiliateId: string`
  - `currency?: ExchangeCurrencyCode` (없으면 모든 통화)
- **반환**: `AffiliateWallet | AffiliateWallet[]`

#### 1.4 GetCommissionRateService
- **책임**: 어필리에이트의 현재 적용 요율 조회
- **의존성**:
  - `AffiliateTierRepositoryPort`
  - `CommissionPolicy`
- **파라미터**:
  - `affiliateId: string`
- **반환**: `{ tier, baseRate, customRate, effectiveRate }`

### 2. 계산 및 누적 계열

#### 2.1 CalculateCommissionService
- **책임**: 게임 라운드에 대한 커미션 계산 및 생성
- **의존성**:
  - `AffiliateCommissionRepositoryPort`
  - `AffiliateTierRepositoryPort`
  - `AffiliateWalletRepositoryPort`
  - `AffiliateReferralModule` (FindReferralBySubUserIdService)
  - `CommissionPolicy`
  - `IdUtil` (generateUid)
- **파라미터**:
  - `subUserId: string` (게임 플레이한 유저)
  - `gameRoundId: bigint`
  - `wagerAmount: Prisma.Decimal`
  - `winAmount?: Prisma.Decimal | null`
  - `currency: ExchangeCurrencyCode`
  - `gameCategory?: GameCategory | null`
- **반환**: `AffiliateCommission`
- **트랜잭션**: 필수 (`@Transactional()`)
- **비즈니스 로직**:
  1. 레퍼럴 관계 조회 (subUserId → affiliateId)
  2. 레퍼럴 관계가 없으면 커미션 생성하지 않음 (null 반환)
  3. 티어 조회 (없으면 생성)
  4. 적용 요율 계산 (수동 요율 우선, 없으면 기본 요율)
  5. 커미션 금액 계산 (wagerAmount * rate)
  6. 커미션 엔티티 생성 및 저장
  7. 월렛에 pendingBalance 추가 (addPendingCommission)
  8. 티어의 월간 베팅 금액 업데이트

#### 2.2 AccumulateCommissionService
- **책임**: 여러 게임 라운드에 대한 커미션 일괄 계산 및 누적
- **의존성**:
  - `CalculateCommissionService` (재사용)
- **파라미터**:
  - `rounds: Array<{ subUserId, gameRoundId, wagerAmount, winAmount?, currency, gameCategory? }>`
- **반환**: `AffiliateCommission[]`
- **트랜잭션**: 필수

### 3. 정산 계열

#### 3.1 SettleDailyCommissionsService
- **책임**: 일일 커미션 정산 (PENDING → AVAILABLE)
- **의존성**:
  - `AffiliateCommissionRepositoryPort`
  - `AffiliateWalletRepositoryPort`
  - `CommissionPolicy`
- **파라미터**:
  - `settlementDate: Date` (정산 기준일)
  - `affiliateId?: string` (특정 어필리에이트만, 없으면 전체)
- **반환**: `{ settledCount: number, totalAmount: Prisma.Decimal }`
- **트랜잭션**: 필수
- **비즈니스 로직**:
  1. 정산 대상 커미션 조회 (PENDING 상태, settlementDate 이전)
  2. 어필리에이트별로 그룹화
  3. 각 어필리에이트의 월렛 조회
  4. 월렛의 settlePendingCommission 호출
  5. 커미션 상태 업데이트 (PENDING → AVAILABLE)
  6. 커미션의 settlementDate 설정

### 4. 출금 계열

#### 4.1 WithdrawCommissionService
- **책임**: 커미션 출금 처리
- **의존성**:
  - `AffiliateWalletRepositoryPort`
  - `CommissionPolicy`
- **파라미터**:
  - `affiliateId: string`
  - `currency: ExchangeCurrencyCode`
  - `amount: Prisma.Decimal`
  - `requestInfo?: RequestClientInfo` (Activity Log용)
- **반환**: `AffiliateWallet`
- **트랜잭션**: 필수
- **비즈니스 로직**:
  1. 월렛 조회
  2. 출금 가능 여부 검증 (Policy.canWithdraw)
  3. 월렛의 withdraw 호출
  4. 월렛 업데이트
  5. Activity Log 기록

### 5. 요율 관리 계열

#### 5.1 SetCustomRateService
- **책임**: 어필리에이트의 수동 요율 설정
- **의존성**:
  - `AffiliateTierRepositoryPort`
  - `CommissionPolicy`
- **파라미터**:
  - `affiliateId: string`
  - `customRate: Prisma.Decimal`
  - `setBy: string` (관리자 ID)
  - `requestInfo?: RequestClientInfo`
- **반환**: `AffiliateTier`
- **트랜잭션**: 필수
- **비즈니스 로직**:
  1. 티어 조회 (없으면 생성)
  2. 요율 유효성 검증 (Policy.validateRate)
  3. 티어의 setCustomRate 호출
  4. 티어 업데이트
  5. Activity Log 기록

#### 5.2 ResetCustomRateService
- **책임**: 어필리에이트의 수동 요율 해제 (기본 요율로 복귀)
- **의존성**:
  - `AffiliateTierRepositoryPort`
- **파라미터**:
  - `affiliateId: string`
  - `requestInfo?: RequestClientInfo`
- **반환**: `AffiliateTier`
- **트랜잭션**: 필수
- **비즈니스 로직**:
  1. 티어 조회
  2. 티어의 resetCustomRate 호출
  3. 티어 업데이트
  4. Activity Log 기록

## 의존성 관계도

```
CalculateCommissionService
  ├─ AffiliateCommissionRepositoryPort
  ├─ AffiliateTierRepositoryPort
  ├─ AffiliateWalletRepositoryPort
  ├─ FindReferralBySubUserIdService (AffiliateReferralModule)
  └─ CommissionPolicy

AccumulateCommissionService
  └─ CalculateCommissionService

SettleDailyCommissionsService
  ├─ AffiliateCommissionRepositoryPort
  ├─ AffiliateWalletRepositoryPort
  └─ CommissionPolicy

WithdrawCommissionService
  ├─ AffiliateWalletRepositoryPort
  └─ CommissionPolicy

SetCustomRateService
  ├─ AffiliateTierRepositoryPort
  └─ CommissionPolicy

ResetCustomRateService
  └─ AffiliateTierRepositoryPort

FindCommissionsService
  └─ AffiliateCommissionRepositoryPort

FindCommissionByIdService
  └─ AffiliateCommissionRepositoryPort

GetWalletBalanceService
  └─ AffiliateWalletRepositoryPort

GetCommissionRateService
  ├─ AffiliateTierRepositoryPort
  └─ CommissionPolicy
```

## 구현 순서

### Phase 1: 기초 조회 서비스 (의존성 없음)
1. ✅ FindCommissionByIdService
2. ✅ FindCommissionsService
3. ✅ GetWalletBalanceService
4. ✅ GetCommissionRateService

### Phase 2: 요율 관리 서비스 (Phase 1 의존)
5. ✅ SetCustomRateService
6. ✅ ResetCustomRateService

### Phase 3: 커미션 계산 서비스 (Phase 1, 2 의존)
7. ✅ CalculateCommissionService
8. ✅ AccumulateCommissionService

### Phase 4: 정산 및 출금 서비스 (Phase 1, 3 의존)
9. ✅ SettleDailyCommissionsService
10. ✅ WithdrawCommissionService

## 공통 패턴

### 1. 서비스 구조
```typescript
interface ServiceParams {
  // 파라미터 정의
  requestInfo?: RequestClientInfo; // Activity Log용 (선택)
}

@Injectable()
export class ServiceName {
  constructor(
    @Inject(REPOSITORY_TOKEN)
    private readonly repository: RepositoryPort,
    private readonly policy: CommissionPolicy, // 필요시
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort, // 필요시
  ) {}

  @Transactional() // 트랜잭션이 필요한 경우
  async execute({ ...params }: ServiceParams): Promise<ReturnType> {
    // 비즈니스 로직
  }
}
```

### 2. ID 생성
- 커미션 UID 생성: `IdUtil.generateUid()` 사용
- 도메인 엔티티 생성 시 `uid` 필수 전달

### 3. Prisma.Decimal 처리
- 모든 금액/요율은 `Prisma.Decimal` 사용
- bigint 변환 시: `BigInt(decimal.toFixed(0))`
- Decimal 생성 시: `new Prisma.Decimal('1000')` (문자열 사용)

### 4. 트랜잭션
- 데이터 변경이 있는 서비스는 `@Transactional()` 데코레이터 필수
- 조회만 하는 서비스는 트랜잭션 불필요

### 5. Activity Log
- 데이터 변경이 있는 서비스는 Activity Log 기록
- `requestInfo`가 제공된 경우에만 기록
- ActivityType은 `ActivityType` enum에서 적절한 값 선택

### 6. 예외 처리
- 도메인 예외는 도메인 레이어에서 던짐
- Repository의 `get*` 메서드는 자동으로 예외 발생
- Repository의 `find*` 메서드는 null 반환 가능

## 모듈 등록

`commission.module.ts`에 다음 순서로 등록:

1. Infrastructure (Mapper, Repository)
2. Use Case Services
3. Repository Provider (Token 바인딩)

```typescript
providers: [
  // Domain Policy
  CommissionPolicy,
  
  // Infrastructure
  AffiliateWalletMapper,
  AffiliateCommissionMapper,
  AffiliateTierMapper,
  
  // Repository (Outbound Port 구현)
  {
    provide: AFFILIATE_WALLET_REPOSITORY,
    useClass: AffiliateWalletRepository,
  },
  {
    provide: AFFILIATE_COMMISSION_REPOSITORY,
    useClass: AffiliateCommissionRepository,
  },
  {
    provide: AFFILIATE_TIER_REPOSITORY,
    useClass: AffiliateTierRepository,
  },
  
  // Use Case Services
  FindCommissionByIdService,
  FindCommissionsService,
  GetWalletBalanceService,
  GetCommissionRateService,
  SetCustomRateService,
  ResetCustomRateService,
  CalculateCommissionService,
  AccumulateCommissionService,
  SettleDailyCommissionsService,
  WithdrawCommissionService,
],
```

## 외부 모듈 의존성

### AffiliateReferralModule
- `FindReferralBySubUserIdService`: subUserId로 레퍼럴 관계 조회
- `commission.module.ts`의 `imports`에 `AffiliateReferralModule` 추가 필요

## 참고사항

1. **티어 자동 생성**: 티어가 없으면 기본 티어(BRONZE)로 자동 생성
2. **월렛 자동 생성**: 월렛이 없으면 0 잔액으로 자동 생성 (upsert 사용)
3. **커미션 중복 방지**: `gameRoundId`로 중복 체크 (이미 존재하면 생성하지 않음)
4. **정산 날짜**: 정산은 매일 자정에 실행 (Scheduler에서 호출)
5. **월간 베팅 금액**: 매월 1일 자정에 리셋 (Scheduler에서 호출)

