# 리퍼럴 시스템 구현 명세서

## 📋 프로젝트 개요

### 목표
BC.Game 스타일의 다층 리퍼럴 시스템 구축
- 다중 리퍼럴 코드 생성 및 관리
- 이중 보상 구조 (커미션 + 마일스톤)
- 실시간 통계 및 대시보드
- 사기 탐지 및 방지 시스템

### 핵심 가치
- **추천인**: 지속적인 수동 소득 창출
- **피추천인**: 첫 가입 혜택 및 보너스
- **플랫폼**: 유저 획득 비용 절감 및 바이럴 성장

---

## 🎯 Phase 1: 기본 인프라 구축 (Week 1-2)

### 1.1 데이터베이스 스키마 구현
**우선순위: 🔴 최고**

#### 작업 내용
```bash
# Prisma 스키마 적용
- ReferralCode (리퍼럴 코드)
- Referral (추천 관계)
- ReferralClick (클릭 추적)
- ReferralCommissionConfig (커미션 설정)
- UserReferralStats (유저 통계)
```

#### 체크리스트
- [ ] Prisma 스키마 파일 작성
- [ ] 마이그레이션 생성 및 실행
- [ ] 시드 데이터 작성 (커미션 설정)
- [ ] 인덱스 최적화 확인

#### 시드 데이터 예시
```typescript
// prisma/seeds/referral.seed.ts
const commissionConfigs = [
  {
    gameCategory: 'SPORTS',
    gameCategoryName: '스포츠 베팅',
    baseCommissionRate: 2500,    // 25%
    houseEdgeRate: 150,          // 1.5%
    wagerMultiplier: 10000,      // 100%
  },
  {
    gameCategory: 'SLOTS',
    gameCategoryName: '슬롯',
    baseCommissionRate: 2500,
    houseEdgeRate: 200,          // 2%
    wagerMultiplier: 6000,       // 60%
  },
  // ... 추가
];
```

#### 예상 소요 시간
- 스키마 작성: 4시간
- 마이그레이션: 2시간
- 시드 데이터: 2시간
- 테스트: 4시간
**총 12시간**

---

### 1.2 리퍼럴 코드 생성 API
**우선순위: 🔴 최고**

#### 엔드포인트
```
POST   /api/referrals/codes          # 코드 생성
GET    /api/referrals/codes          # 내 코드 목록
PATCH  /api/referrals/codes/:id      # 코드 수정
DELETE /api/referrals/codes/:id      # 코드 삭제
```

#### API 명세

**POST /api/referrals/codes**
```typescript
// Request
{
  campaignName?: string;
  customCode?: string;  // 커스텀 코드 (없으면 랜덤 생성)
}

// Response
{
  id: string;
  code: string;
  campaignName: string | null;
  shortUrl: string;
  totalClicks: 0;
  totalSignups: 0;
  isActive: true;
  createdAt: string;
}
```

#### 비즈니스 로직
```typescript
// services/referral/code.service.ts
async function createReferralCode(userId: string, data: CreateCodeDto) {
  // 1. 유저당 최대 20개 제한 확인
  const count = await prisma.referralCode.count({
    where: { userId, isActive: true }
  });
  
  if (count >= 20) {
    throw new Error('최대 20개까지 생성 가능합니다');
  }
  
  // 2. 커스텀 코드 검증
  if (data.customCode) {
    // 6-12자, 영숫자만
    if (!/^[A-Z0-9]{6,12}$/i.test(data.customCode)) {
      throw new Error('코드는 6-12자 영숫자만 가능합니다');
    }
    
    // 중복 체크
    const exists = await prisma.referralCode.findUnique({
      where: { code: data.customCode.toUpperCase() }
    });
    
    if (exists) {
      throw new Error('이미 사용 중인 코드입니다');
    }
  }
  
  // 3. 코드 생성
  const code = data.customCode?.toUpperCase() || generateRandomCode();
  
  // 4. DB 저장
  const referralCode = await prisma.referralCode.create({
    data: {
      userId,
      code,
      campaignName: data.campaignName,
      shortUrl: `${config.baseUrl}/r/${code}`,
      isDefault: count === 0, // 첫 코드는 기본 코드
    }
  });
  
  return referralCode;
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

#### 체크리스트
- [ ] DTO 정의 (Zod 또는 class-validator)
- [ ] Service 레이어 구현
- [ ] Controller 구현
- [ ] 유닛 테스트 작성
- [ ] API 문서 작성

#### 예상 소요 시간
**8시간**

---

### 1.3 회원가입 시 리퍼럴 연결
**우선순위: 🔴 최고**

#### 작업 내용
기존 회원가입 로직에 리퍼럴 처리 추가

#### 수정할 파일
```typescript
// services/auth/signup.service.ts
async function signup(data: SignupDto) {
  // 1. 기존 회원가입 로직
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash: await hash(data.password),
    }
  });
  
  // 2. 리퍼럴 코드가 있으면 연결
  if (data.referralCode) {
    await linkReferral(user.id, data.referralCode, {
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      country: data.country,
    });
  }
  
  return user;
}

async function linkReferral(
  userId: string, 
  code: string,
  trackingData: TrackingData
) {
  // 1. 리퍼럴 코드 조회
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { user: true }
  });
  
  if (!referralCode || !referralCode.isActive) {
    throw new Error('유효하지 않은 리퍼럴 코드입니다');
  }
  
  // 2. 자기 자신 추천 방지
  if (referralCode.userId === userId) {
    throw new Error('자신을 추천할 수 없습니다');
  }
  
  // 3. Referral 관계 생성
  const referral = await prisma.referral.create({
    data: {
      referrerId: referralCode.userId,
      refereeId: userId,
      referralCodeId: referralCode.id,
      ipAddress: trackingData.ipAddress,
      userAgent: trackingData.userAgent,
      country: trackingData.country,
      status: 'PENDING',
    }
  });
  
  // 4. 통계 업데이트
  await prisma.referralCode.update({
    where: { id: referralCode.id },
    data: {
      totalSignups: { increment: 1 },
    }
  });
  
  // 5. 클릭 기록 업데이트 (회원가입 완료 표시)
  await prisma.referralClick.updateMany({
    where: {
      referralCodeId: referralCode.id,
      ipAddress: trackingData.ipAddress,
      didSignup: false,
    },
    data: {
      didSignup: true,
      signupUserId: userId,
    }
  });
  
  return referral;
}
```

#### 체크리스트
- [ ] 회원가입 DTO에 referralCode 필드 추가
- [ ] linkReferral 서비스 구현
- [ ] 자기 추천 방지 로직
- [ ] 중복 가입 방지 (이미 다른 코드로 가입한 경우)
- [ ] 에러 처리
- [ ] 테스트 케이스 작성

#### 예상 소요 시간
**6시간**

---

## 🎯 Phase 2: 클릭 추적 및 랜딩 페이지 (Week 2-3)

### 2.1 리퍼럴 링크 리다이렉션
**우선순위: 🟡 높음**

#### 엔드포인트
```
GET /r/:code                # 리퍼럴 링크
```

#### 동작 흐름
```typescript
// pages/api/r/[code].ts (Next.js 예시)
export async function GET(req: Request, { params }: { params: { code: string } }) {
  const { code } = params;
  const { searchParams } = new URL(req.url);
  
  // 1. 리퍼럴 코드 검증
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: code.toUpperCase() }
  });
  
  if (!referralCode || !referralCode.isActive) {
    return Response.redirect(`${config.baseUrl}/signup`);
  }
  
  // 2. 클릭 추적
  await trackClick(referralCode.id, {
    ipAddress: req.headers.get('x-forwarded-for') || req.ip,
    userAgent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    utmSource: searchParams.get('utm_source'),
    utmMedium: searchParams.get('utm_medium'),
    utmCampaign: searchParams.get('utm_campaign'),
  });
  
  // 3. 쿠키에 코드 저장 (30일)
  const response = Response.redirect(`${config.baseUrl}/signup`);
  response.cookies.set('ref_code', code, {
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  
  return response;
}

async function trackClick(referralCodeId: string, data: TrackingData) {
  // 클릭 기록 저장
  await prisma.referralClick.create({
    data: {
      referralCodeId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referer: data.referer,
      country: await getCountryFromIp(data.ipAddress),
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
    }
  });
  
  // 총 클릭수 증가
  await prisma.referralCode.update({
    where: { id: referralCodeId },
    data: { 
      totalClicks: { increment: 1 },
      lastUsedAt: new Date(),
    }
  });
}
```

#### 체크리스트
- [ ] 리다이렉션 핸들러 구현
- [ ] 클릭 추적 서비스 구현
- [ ] IP → 국가 변환 (GeoIP)
- [ ] 쿠키 처리 로직
- [ ] 봇 필터링 (User-Agent 검증)

#### 예상 소요 시간
**6시간**

---

### 2.2 리퍼럴 랜딩 페이지
**우선순위: 🟡 높음**

#### 페이지 구성
```
/signup?ref=ABC123
├─ 헤더: "친구 초대로 가입하고 보너스 받기"
├─ 추천인 정보 표시
│  └─ 아바타, 닉네임, 레벨
├─ 가입 폼
└─ 혜택 안내
   ├─ 웰컴 보너스
   └─ 첫 입금 보너스
```

#### 컴포넌트 구조
```typescript
// components/ReferralSignup.tsx
function ReferralSignup({ referralCode }: { referralCode?: string }) {
  const { data: referrerInfo } = useQuery({
    queryKey: ['referrer', referralCode],
    queryFn: () => fetchReferrerInfo(referralCode),
    enabled: !!referralCode,
  });
  
  return (
    <div>
      {referrerInfo && (
        <ReferrerCard referrer={referrerInfo} />
      )}
      
      <SignupForm 
        referralCode={referralCode}
        bonuses={referrerInfo?.bonuses}
      />
      
      <BenefitsList />
    </div>
  );
}
```

#### API
```typescript
GET /api/referrals/public/:code

// Response
{
  referrer: {
    username: string;
    avatarUrl: string;
    level: number;
    tier?: string;
  },
  bonuses: {
    welcome: { amount: 10000, currency: 'USD' },
    firstDeposit: { percentage: 100, maxAmount: 100000 }
  }
}
```

#### 체크리스트
- [ ] API 엔드포인트 구현
- [ ] UI 컴포넌트 작성
- [ ] 반응형 디자인
- [ ] 로딩/에러 상태 처리

#### 예상 소요 시간
**12시간**

---

## 🎯 Phase 3: 커미션 시스템 (Week 3-4)

### 3.1 일일 커미션 계산 배치
**우선순위: 🔴 최고**

#### Cron Job 설정
```typescript
// jobs/daily-commission.job.ts
import cron from 'node-cron';

// 매일 오전 2시에 실행
cron.schedule('0 2 * * *', async () => {
  console.log('커미션 계산 시작...');
  await calculateDailyCommissions();
});
```

#### 커미션 계산 로직
```typescript
async function calculateDailyCommissions() {
  const yesterday = subDays(new Date(), 1);
  const startTime = startOfDay(yesterday);
  const endTime = endOfDay(yesterday);
  
  // 1. 어제의 모든 베팅 기록 조회
  const bets = await prisma.gameHistory.findMany({
    where: {
      createdAt: { gte: startTime, lt: endTime },
      status: 'COMPLETED',
    },
    include: {
      game: true,
      user: {
        include: {
          referredBy: true, // 리퍼럴 관계
        }
      }
    }
  });
  
  // 2. 유저별, 게임 카테고리별로 그룹핑
  const grouped = groupBy(bets, (bet) => 
    `${bet.userId}_${bet.game.category}`
  );
  
  // 3. 각 그룹별 커미션 계산
  for (const [key, betGroup] of Object.entries(grouped)) {
    const firstBet = betGroup[0];
    const referral = firstBet.user.referredBy;
    
    // 리퍼럴이 없으면 스킵
    if (!referral) continue;
    
    // 커미션 설정 조회
    const config = await prisma.referralCommissionConfig.findUnique({
      where: { gameCategory: firstBet.game.category }
    });
    
    if (!config || !config.isActive) continue;
    
    // 총 베팅액 계산
    const totalWager = betGroup.reduce(
      (sum, bet) => sum + bet.betAmount, 
      0n
    );
    
    // 커미션 계산
    // 공식: wager × houseEdge × baseCommission × multiplier / 1,000,000
    const commission = 
      totalWager *
      BigInt(config.houseEdgeRate) *
      BigInt(config.baseCommissionRate) *
      BigInt(config.wagerMultiplier) /
      1000000n;
    
    // 4. 커미션 레코드 생성
    await prisma.referralCommission.create({
      data: {
        referrerId: referral.referrerId,
        referralId: referral.id,
        refereeId: firstBet.userId,
        refereeName: firstBet.user.username,
        period: yesterday,
        gameCategory: firstBet.game.category,
        totalWager,
        houseEdge: config.houseEdgeRate,
        commissionRate: config.baseCommissionRate,
        amount: commission,
        currencyCode: 'USD',
        status: 'PENDING',
      }
    });
    
    // 5. 통계 업데이트
    await prisma.userReferralStats.update({
      where: { userId: referral.referrerId },
      data: {
        pendingCommissions: { increment: commission },
        monthlyEarnings: { increment: commission },
      }
    });
  }
  
  console.log('커미션 계산 완료');
}
```

#### 체크리스트
- [ ] Cron Job 설정
- [ ] 커미션 계산 서비스 구현
- [ ] 에러 처리 및 재시도 로직
- [ ] 로깅 및 모니터링
- [ ] 중복 실행 방지 (분산 락)
- [ ] 알림 발송 (커미션 지급 알림)

#### 예상 소요 시간
**16시간**

---

### 3.2 커미션 승인 및 지급
**우선순위: 🟡 높음**

#### 자동 승인 로직
```typescript
// 24시간 후 자동 승인
async function autoApproveCommissions() {
  const threshold = subHours(new Date(), 24);
  
  const approved = await prisma.referralCommission.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: threshold },
    },
    data: {
      status: 'APPROVED',
    }
  });
  
  console.log(`${approved.count}건의 커미션 자동 승인`);
}
```

#### 수동 출금 API
```typescript
POST /api/referrals/withdraw

// Request
{
  amount: string;  // "100000" (BigInt)
  currencyCode: string;
}

// Response
{
  transactionId: string;
  amount: string;
  status: 'COMPLETED';
}

// Service
async function withdrawCommissions(userId: string, amount: bigint) {
  // 1. 승인된 커미션 조회
  const stats = await prisma.userReferralStats.findUnique({
    where: { userId }
  });
  
  if (!stats || stats.pendingCommissions < amount) {
    throw new Error('출금 가능 금액이 부족합니다');
  }
  
  // 2. 출금 가능한 커미션 목록
  const commissions = await prisma.referralCommission.findMany({
    where: {
      referrerId: userId,
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'asc' },
  });
  
  // 3. 금액만큼 커미션 차감
  let remaining = amount;
  const toUpdate: string[] = [];
  
  for (const commission of commissions) {
    if (remaining <= 0) break;
    
    if (commission.amount <= remaining) {
      toUpdate.push(commission.id);
      remaining -= commission.amount;
    }
  }
  
  // 4. 트랜잭션 처리
  const result = await prisma.$transaction(async (tx) => {
    // 커미션 상태 업데이트
    await tx.referralCommission.updateMany({
      where: { id: { in: toUpdate } },
      data: { status: 'PAID' }
    });
    
    // 월렛에 입금
    const wallet = await tx.wallet.findFirst({
      where: { userId, currencyCode: 'USD' }
    });
    
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } }
    });
    
    // Transaction 기록
    const transaction = await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'REFERRAL_COMMISSION',
        amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance + amount,
        status: 'COMPLETED',
      }
    });
    
    // 통계 업데이트
    await tx.userReferralStats.update({
      where: { userId },
      data: {
        pendingCommissions: { decrement: amount },
        totalEarnings: { increment: amount },
      }
    });
    
    return transaction;
  });
  
  return result;
}
```

#### 체크리스트
- [ ] 자동 승인 Cron Job
- [ ] 출금 API 구현
- [ ] 트랜잭션 무결성 보장
- [ ] 출금 한도 설정
- [ ] 관리자 대시보드 (수동 승인)

#### 예상 소요 시간
**12시간**

---

## 🎯 Phase 4: 마일스톤 시스템 (Week 4-5)

### 4.1 마일스톤 설정 및 감지
**우선순위: 🟡 높음**

#### 마일스톤 시드 데이터
```typescript
const milestones = [
  { type: 'LEVEL_UP', level: 4, rewardAmount: 1000000n },   // $10
  { type: 'LEVEL_UP', level: 8, rewardAmount: 2000000n },   // $20
  { type: 'LEVEL_UP', level: 16, rewardAmount: 5000000n },  // $50
  { type: 'LEVEL_UP', level: 32, rewardAmount: 10000000n }, // $100
  { type: 'LEVEL_UP', level: 48, rewardAmount: 50000000n }, // $500
  { type: 'LEVEL_UP', level: 70, rewardAmount: 100000000n }, // $1,000
];
```

#### 레벨업 이벤트 핸들러
```typescript
// events/user-levelup.handler.ts
async function handleUserLevelUp(userId: string, newLevel: number) {
  // 1. 리퍼럴 관계 확인
  const referral = await prisma.referral.findUnique({
    where: { refereeId: userId }
  });
  
  if (!referral) return;
  
  // 2. 해당 레벨의 마일스톤 조회
  const milestoneConfig = await prisma.referralMilestoneConfig.findUnique({
    where: {
      type_level: {
        type: 'LEVEL_UP',
        level: newLevel,
      }
    }
  });
  
  if (!milestoneConfig || !milestoneConfig.isActive) return;
  
  // 3. 이미 받았는지 확인
  const existing = await prisma.referralMilestone.findUnique({
    where: {
      referralId_configId: {
        referralId: referral.id,
        configId: milestoneConfig.id,
      }
    }
  });
  
  if (existing) return;
  
  // 4. 조건 확인 (입금 필요 등)
  if (milestoneConfig.requireDeposit && !referral.hasDeposited) {
    return;
  }
  
  // 5. 마일스톤 생성
  await prisma.referralMilestone.create({
    data: {
      referrerId: referral.referrerId,
      referralId: referral.id,
      refereeId: userId,
      refereeName: await getUserName(userId),
      configId: milestoneConfig.id,
      type: 'LEVEL_UP',
      level: newLevel,
      rewardAmount: milestoneConfig.rewardAmount,
      currencyCode: milestoneConfig.rewardCurrency,
      status: 'UNLOCKED',
    }
  });
  
  // 6. 통계 업데이트
  await prisma.userReferralStats.update({
    where: { userId: referral.referrerId },
    data: {
      pendingMilestones: { increment: milestoneConfig.rewardAmount },
    }
  });
  
  // 7. 알림 발송
  await sendNotification(referral.referrerId, {
    type: 'MILESTONE_UNLOCKED',
    title: '마일스톤 달성!',
    message: `${refereeName}님이 레벨 ${newLevel}을 달성했습니다!`,
    rewardAmount: milestoneConfig.rewardAmount,
  });
}
```

#### 체크리스트
- [ ] 마일스톤 설정 시드
- [ ] 레벨업 이벤트 리스너
- [ ] 마일스톤 생성 서비스
- [ ] 알림 발송
- [ ] 관리자 마일스톤 관리 UI

#### 예상 소요 시간
**10시간**

---

### 4.2 마일스톤 클레임
**우선순위: 🟡 높음**

#### API
```typescript
POST /api/referrals/milestones/:id/claim

// Response
{
  milestoneId: string;
  rewardAmount: string;
  transactionId: string;
}

// Service
async function claimMilestone(userId: string, milestoneId: string) {
  // 1. 마일스톤 조회
  const milestone = await prisma.referralMilestone.findUnique({
    where: { id: milestoneId }
  });
  
  if (!milestone || milestone.referrerId !== userId) {
    throw new Error('마일스톤을 찾을 수 없습니다');
  }
  
  if (milestone.status !== 'UNLOCKED') {
    throw new Error('클레임할 수 없는 상태입니다');
  }
  
  // 2. 트랜잭션 처리
  const result = await prisma.$transaction(async (tx) => {
    // 마일스톤 상태 업데이트
    await tx.referralMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'CLAIMED',
        claimedAt: new Date(),
      }
    });
    
    // 월렛에 입금
    const wallet = await tx.wallet.findFirst({
      where: { 
        userId, 
        currencyCode: milestone.currencyCode 
      }
    });
    
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: milestone.rewardAmount } }
    });
    
    // Transaction 기록
    const transaction = await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'REFERRAL_MILESTONE',
        amount: milestone.rewardAmount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance + milestone.rewardAmount,
        status: 'COMPLETED',
        referenceId: milestoneId,
        referenceType: 'MILESTONE',
      }
    });
    
    // 통계 업데이트
    await tx.userReferralStats.update({
      where: { userId },
      data: {
        pendingMilestones: { decrement: milestone.rewardAmount },
        totalMilestones: { increment: milestone.rewardAmount },
        totalEarnings: { increment: milestone.rewardAmount },
      }
    });
    
    return transaction;
  });
  
  return result;
}
```

#### 체크리스트
- [ ] 클레임 API 구현
- [ ] UI 컴포넌트 (마일스톤 카드)
- [ ] 클레임 애니메이션 효과
- [ ] 에러 처리

#### 예상 소요 시간
**8시간**

---

## 🎯 Phase 5: 대시보드 및 통계 (Week 5-6)

### 5.1 리퍼럴 대시보드 API
**우선순위: 🟡 높음**

#### 엔드포인트
```
GET /api/referrals/dashboard           # 전체 요약
GET /api/referrals/referees            # 피추천인 목록
GET /api/referrals/earnings            # 수익 내역
GET /api/referrals/analytics           # 분석 데이터
```

#### 대시보드 데이터
```typescript
async function getDashboard(userId: string) {
  const [stats, codes, recentReferrals, earnings] = await Promise.all([
    // 1. 통계
    prisma.userReferralStats.findUnique({
      where: { userId }
    }),
    
    // 2. 리퍼럴 코드 목록
    prisma.referralCode.findMany({
      where: { userId, isActive: true },
      orderBy: { totalEarnings: 'desc' },
      take: 5,
    }),
    
    // 3. 최근 피추천인
    prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: {
            username: true,
            avatarUrl: true,
            level: true,
            lastLoginAt: true,
          }
        },
        referralCode: {
          select: { code: true, campaignName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    
    // 4. 수익 내역
    Promise.all([
      // 커미션
      prisma.referralCommission.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // 마일스톤
      prisma.referralMilestone.findMany({
        where: { referrerId: userId },
        orderBy: { achievedAt: 'desc' },
        take: 20,
      }),
    ]),
  ]);
  
  // 5. 차트 데이터 (최근 30일)
  const chartData = await getReferralChartData(userId, 30);
  
  return {
    stats: {
      totalReferrals: stats.totalReferrals,
      activeReferrals: stats.activeReferrals,
      totalEarnings: stats.totalEarnings,
      pendingCommissions: stats.pendingCommissions,
      pendingMilestones: stats.pendingMilestones,
      currentTier: stats.currentTier,
      tierProgress: stats.tierProgress,
    },
    topCodes: codes,
    recentReferrals,
    earnings: {
      commissions: earnings[0],
      milestones: earnings[1],
    },
    chartData,
  };
}

async function getReferralChartData(userId: string, days: number) {
  const startDate = subDays(new Date(), days);
  
  const data = await prisma.referralDailySummary.findMany({
    where: {
      userId,
      date: { gte: startDate }
    },
    orderBy: { date: 'asc' }
  });
  
  return data.map(d => ({
    date: d.date,
    commissions: d.totalCommissions,
    milestones: d.totalMilestones,
    activeReferees: d.activeReferees,
    totalWager: d.totalWager,
  }));
}
```

#### 체크리스트
- [ ] API 엔드포인트 구현
- [ ] 응답 캐싱 (Redis)
- [ ] 페이지네이션
- [ ] 필터 및 정렬

#### 예상 소요 시간
**12시간**

---

### 5.2 대시보드 UI 구현
**우선순위: 🟡 높음**

#### 컴포넌트 구조
```
/referrals
├─ StatsCards (총 수익, 활성 피추천인, 대기 중 커미션)
├─ EarningsChart (일별 수익 차트)
├─ ReferralCodesList (코드 목록 + 생성 버튼)
├─ RefereesTable (피추천인 목록)
├─ EarningsTimeline (수익 내역)
└─ WithdrawButton (출금 버튼)
```

#### 주요 기능
1. **통계 카드**
   - 총 수익, 이번 달 수익, 대기 중 금액
   - 전월 대비 증감률

2. **수익 차트**
   - 일별/주별/월별 커미션 차트
   - 게임 카테고리별 분포
   - Recharts 사용

3. **피추천인 테이블**
   - 이름, 레벨, 가입일, 총 베팅액, 발생 커미션
   - 정렬, 필터, 검색
   - 페이지네이션

4. **출금 모달**
   - 출금 가능 금액 표시
   - 출금 신청 폼
   - 수수료 안내

#### 체크리스트
- [ ] 통계 카드 컴포넌트
- [ ] 차트 컴포넌트
- [ ] 테이블 컴포넌트
- [ ] 출금 모달
- [ ] 반응형 디자인
- [ ] 로딩 스켈레톤

#### 예상 소요 시간
**20시간**

---

## 🎯 Phase 6: 사기 방지 및 보안 (Week 6-7)

### 6.1 사기 탐지 시스템
**우선순위: 🟡 높음**

#### 탐지 규칙

**1. 동일 IP 체크**
```typescript
async function checkSameIP(referralId: string) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId }
  });
  
  const count = await prisma.referral.count({
    where: {
      referrerId: referral.referrerId,
      ipAddress: referral.ipAddress,
      createdAt: { gte: subDays(new Date(), 7) }
    }
  });
  
  if (count >= 3) {
    await createFraudCheck({
      referralId,
      checkType: 'SAME_IP',
      reason: `7일 내 동일 IP ${count}건 가입`,
      riskScore: 80,
      action: 'COMMISSION_HELD',
    });
  }
}
```

**2. 비정상 패턴 탐지**
```typescript
async function detectUnusualPattern(referrerId: string) {
  const referrals = await prisma.referral.findMany({
    where: {
      referrerId,
      createdAt: { gte: subHours(new Date(), 1) }
    }
  });
  
  // 1시간에 10명 이상 가입
  if (referrals.length >= 10) {
    await createFraudCheck({
      referralId: referrals[0].id,
      checkType: 'RAPID_SIGNUP',
      reason: `1시간 내 ${referrals.length}명 가입`,
      riskScore: 90,
      action: 'UNDER_REVIEW',
    });
  }
}
```

**3. 미활동 사용자**
```typescript
async function checkInactiveReferees() {
  const inactive = await prisma.referral.findMany({
    where: {
      status: 'PENDING',
      hasWagered: false,
      createdAt: { lt: subDays(new Date(), 7) }
    }
  });
  
  for (const ref of inactive) {
    await createFraudCheck({
      referralId: ref.id,
      checkType: 'NO_ACTIVITY',
      reason: '가입 후 7일간 베팅 없음',
      riskScore: 50,
      action: 'FLAGGED',
    });
  }
}
```

#### 자동 조치
```typescript
async function handleFraudDetection(fraudCheck: FraudCheck) {
  switch (fraudCheck.action) {
    case 'COMMISSION_HELD':
      // 커미션 지급 보류
      await prisma.referralCommission.updateMany({
        where: { referralId: fraudCheck.referralId },
        data: { status: 'LOCKED' }
      });
      break;
      
    case 'REFERRAL_BLOCKED':
      // 리퍼럴 차단
      await prisma.referral.update({
        where: { id: fraudCheck.referralId },
        data: { status: 'BLOCKED' }
      });
      break;
      
    case 'ACCOUNT_SUSPENDED':
      // 계정 정지
      const referral = await prisma.referral.findUnique({
        where: { id: fraudCheck.referralId }
      });
      
      await prisma.user.update({
        where: { id: referral.referrerId },
        data: { 
          isBanned: true,
          banReason: '리퍼럴 사기 의심'
        }
      });
      break;
  }
}
```

#### 체크리스트
- [ ] 탐지 규칙 구현
- [ ] Cron Job 설정
- [ ] 관리자 알림
- [ ] 수동 검토 대시보드

#### 예상 소요 시간
**16시간**

---

### 6.2 관리자 리뷰 시스템
**우선순위: 🟢 중간**

#### 관리자 대시보드
```
/admin/referrals/fraud
├─ 의심 케이스 목록
├─ 상세 정보 보기
│  ├─ IP, 디바이스 정보
│  ├─ 베팅 히스토리
│  └─ 관련 계정
└─ 조치 버튼 (승인/차단/보류)
```

#### API
```typescript
PATCH /api/admin/referrals/fraud/:id/resolve

// Request
{
  action: 'CLEARED' | 'COMMISSION_HELD' | 'ACCOUNT_SUSPENDED',
  note: string
}

// Service
async function resolveFraudCase(
  fraudCheckId: string, 
  adminId: string,
  resolution: Resolution
) {
  await prisma.referralFraudCheck.update({
    where: { id: fraudCheckId },
    data: {
      action: resolution.action,
      actionBy: adminId,
      actionNote: resolution.note,
      resolvedAt: new Date(),
    }
  });
  
  // 조치 실행
  await handleFraudDetection({ ...fraudCheck, action: resolution.action });
}
```

#### 체크리스트
- [ ] 프론트엔드 구현
- [ ] 권한 체크
- [ ] 로그 기록

#### 예상 소요 시간
**12시간**

---

## 🎯 Phase 7: 고급 기능 (Week 7-8)

### 7.1 티어 시스템
**우선순위: 🟢 중간**

#### 월별 티어 재계산
```typescript
// 매월 1일 오전 3시
cron.schedule('0 3 1 * *', async () => {
  await recalculateReferralTiers();
});

async function recalculateReferralTiers() {
  const users = await prisma.userReferralStats.findMany();
  
  for (const stats of users) {
    // 조건에 맞는 최고 티어 찾기
    const tier = await prisma.referralTier.findFirst({
      where: {
        minActiveReferrals: { lte: stats.activeReferrals },
        minMonthlyWager: { lte: stats.monthlyWager },
        minMonthlyEarnings: { lte: stats.monthlyEarnings },
      },
      orderBy: { tier: 'desc' }
    });
    
    if (tier && tier.tier > stats.currentTier) {
      // 티어 업그레이드
      await prisma.userReferralStats.update({
        where: { userId: stats.userId },
        data: { currentTier: tier.tier }
      });
      
      // 축하 알림
      await sendTierUpgradeNotification(stats.userId, tier);
    }
    
    // 월간 통계 리셋
    await prisma.userReferralStats.update({
      where: { userId: stats.userId },
      data: {
        monthlyWager: 0,
        monthlyEarnings: 0,
        monthlyReferrals: 0,
      }
    });
  }
}
```

#### 체크리스트
- [ ] 티어 설정 시드
- [ ] 재계산 Cron Job
- [ ] 티어 배지 UI
- [ ] 혜택 안내 페이지

#### 예상 소요 시간
**10시간**

---

### 7.2 통계 집계 최적화
**우선순위: 🟢 중간**

#### 일별 집계 배치
```typescript
// 매일 오전 3시 (커미션 계산 후)
cron.schedule('0 3 * * *', async () => {
  await aggregateDailyStats();
});

async function aggregateDailyStats() {
  const yesterday = subDays(new Date(), 1);
  
  const referrers = await prisma.referral.groupBy({
    by: ['referrerId'],
    _count: true,
  });
  
  for (const { referrerId } of referrers) {
    // 어제의 커미션 합계
    const commissions = await prisma.referralCommission.aggregate({
      where: {
        referrerId,
        period: yesterday,
      },
      _sum: {
        amount: true,
        totalWager: true,
      }
    });
    
    // 어제의 마일스톤 합계
    const milestones = await prisma.referralMilestone.aggregate({
      where: {
        referrerId,
        achievedAt: {
          gte: startOfDay(yesterday),
          lt: endOfDay(yesterday),
        }
      },
      _sum: { rewardAmount: true },
      _count: true,
    });
    
    // 활성 피추천인 수
    const activeCount = await prisma.referral.count({
      where: {
        referrerId,
        lastActiveAt: {
          gte: startOfDay(yesterday),
          lt: endOfDay(yesterday),
        }
      }
    });
    
    // 신규 가입
    const newReferrals = await prisma.referral.count({
      where: {
        referrerId,
        createdAt: {
          gte: startOfDay(yesterday),
          lt: endOfDay(yesterday),
        }
      }
    });
    
    // 요약 저장
    await prisma.referralDailySummary.create({
      data: {
        userId: referrerId,
        date: yesterday,
        totalCommissions: commissions._sum.amount || 0n,
        totalMilestones: milestones._sum.rewardAmount || 0n,
        milestonesCount: milestones._count,
        activeReferees: activeCount,
        totalWager: commissions._sum.totalWager || 0n,
        newReferrals,
      }
    });
  }
}
```

#### 체크리스트
- [ ] 집계 배치 구현
- [ ] 성능 테스트
- [ ] 모니터링 설정

#### 예상 소요 시간
**8시간**

---

## 📊 전체 일정 요약

| Phase | 기능 | 우선순위 | 예상 시간 | 주차 |
|-------|------|---------|-----------|------|
| 1 | 기본 인프라 | 🔴 최고 | 26시간 | 1-2주 |
| 2 | 클릭 추적 | 🟡 높음 | 18시간 | 2-3주 |
| 3 | 커미션 시스템 | 🔴 최고 | 28시간 | 3-4주 |
| 4 | 마일스톤 | 🟡 높음 | 18시간 | 4-5주 |
| 5 | 대시보드 | 🟡 높음 | 32시간 | 5-6주 |
| 6 | 사기 방지 | 🟡 높음 | 28시간 | 6-7주 |
| 7 | 고급 기능 | 🟢 중간 | 18시간 | 7-8주 |

**총 예상 시간: 168시간 (약 21일)**

---

## 🚀 작업 진행 가이드

### 개발 흐름
```
1. Schema 작성 → Migration
2. Service 로직 구현
3. API 엔드포인트
4. 테스트 작성
5. 프론트엔드 연결
6. E2E 테스트
```

### 일일 체크리스트
- [ ] 작업 브랜치 생성
- [ ] 기능 구현
- [ ] 유닛 테스트
- [ ] 코드 리뷰
- [ ] 머지 및 배포

### 주간 마일스톤
- Week 1-2: 가입 시 리퍼럴 연결 동작
- Week 3-4: 커미션 계산 및 지급 완료
- Week 5-6: 대시보드 오픈
- Week 7-8: 전체 기능 테스트 및 버그 수정

---

## 🔧 기술 스택 권장사항

### 백엔드
- **Node.js** + Express/Fastify
- **Prisma** ORM
- **PostgreSQL** 데이터베이스
- **Redis** 캐싱
- **BullMQ** 작업 큐

### 프론트엔드
- **Next.js** 14+ (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui** 컴포넌트
- **Recharts** 차트
- **React Query** 데이터 페칭

### 인프라
- **Docker** 컨테이너화
- **GitHub Actions** CI/CD
- **Sentry** 에러 추적
- **DataDog** 모니터링

---

## 📝 테스트 전략

### 유닛 테스트
```typescript
describe('ReferralCodeService', () => {
  it('코드를 생성한다', async () => {
    const code = await createReferralCode(userId, {
      campaignName: 'Test'
    });
    
    expect(code.code).toHaveLength(8);
    expect(code.userId).toBe(userId);
  });
  
  it('20개 초과 생성 시 에러', async () => {
    // 20개 생성
    for (let i = 0; i < 20; i++) {
      await createReferralCode(userId, {});
    }
    
    // 21번째 시도
    await expect(
      createReferralCode(userId, {})
    ).rejects.toThrow();
  });
});
```

### 통합 테스트
```typescript
describe('Referral Flow', () => {
  it('가입 → 입금 → 커미션 발생', async () => {
    // 1. 추천인이 코드 생성
    const code = await createCode(referrerId);
    
    // 2. 피추천인 가입
    const referee = await signup({
      referralCode: code.code
    });
    
    // 3. 피추천인 베팅
    await placeBet(referee.id, 10000n);
    
    // 4. 커미션 계산 (배치 실행)
    await calculateDailyCommissions();
    
    // 5. 커미션 확인
    const commission = await getCommission(referrerId);
    expect(commission.amount).toBeGreaterThan(0);
  });
});
```

---

## 🎓 참고 자료

### BC.Game 리퍼럴 분석
- 커미션 구조: 게임별 차등 적용
- 마일스톤: VIP 레벨 기반
- 통계: 실시간 대시보드

### 유사 시스템
- Binance 리퍼럴
- Bybit 어필리에이트
- FTX (과거) 리퍼럴

---

## ⚠️ 주의사항

1. **BigInt 처리**
   - 모든 금액은 BigInt 사용
   - JSON 직렬화 시 String 변환

2. **트랜잭션 무결성**
   - 커미션 지급 시 트랜잭션 필수
   - 롤백 처리 구현

3. **성능 최적화**
   - 통계는 집계 테이블 활용
   - 실시간이 아닌 배치 처리

4. **보안**
   - 자기 추천 방지
   - IP/디바이스 추적
   - Rate limiting

5. **법률 준수**
   - 각국 법률 확인
   - 세금 신고 지원
   - KYC 연동

---

## 📞 다음 단계

1. **Phase 1 시작**: 스키마 작성 및 마이그레이션
2. **시드 데이터 준비**: 커미션 설정, 마일스톤 등
3. **개발 환경 구축**: Docker, 로컬 DB
4. **팀 온보딩**: 명세서 공유 및 역할 분담

**작업을 시작하실 준비가 되셨나요?** 🚀