# Affiliate Referral 모듈 기능 정의서

## 📋 목차
1. [모듈 개요](#모듈-개요)
2. [데이터 모델 분석](#데이터-모델-분석)
3. [핵심 기능 정의](#핵심-기능-정의)
4. [아키텍처 설계](#아키텍처-설계)
5. [구현 우선순위](#구현-우선순위)
6. [다른 모듈과의 연동](#다른-모듈과의-연동)

---

## 모듈 개요

### 목적
레퍼럴 관계(Referral Relationship)를 생성, 관리, 조회하는 기능을 제공합니다.
- 회원가입 시 레퍼럴 코드를 통한 관계 생성
- 셀프 추천 방지 및 사기 탐지
- 레퍼럴 관계 조회 및 통계

### 책임 범위
- ✅ **레퍼럴 관계 생성**: 회원가입 시 레퍼럴 코드로 관계 생성
- ✅ **레퍼럴 관계 조회**: 어플리에이트별 피추천인 목록 조회
- ✅ **셀프 추천 방지**: 자기 자신 추천 방지 로직
- ✅ **중복 가입 방지**: 동일 유저의 중복 레퍼럴 관계 방지
- ✅ **통계 조회**: 레퍼럴 관계 기반 통계 제공
- ❌ **코드 관리**: `code` 모듈에서 담당
- ❌ **커미션 계산**: 추후 별도 모듈에서 담당
- ❌ **마일스톤**: 추후 별도 모듈에서 담당

### 모듈 위치
```
src/modules/affiliate/referral/
├── referral.module.ts
├── application/          # Use Case Services
├── domain/              # Domain Entities & Policies
├── infrastructure/      # Repository 구현
├── ports/              # Ports (인터페이스)
├── controllers/        # REST API Controllers
└── test/               # 테스트
```

---

## 데이터 모델 분석

### Prisma Schema: Referral 모델

```prisma
model Referral {
  id          String @id @default(cuid())
  affiliateId String // 어플리에이트 사용자 ID
  codeId      String // 사용된 어플리에이트 코드 ID
  subUserId   String // 피추천인 (referred player) 사용자 ID

  // 셀프 추천 방지를 위한 정보
  ipAddress         String? // 가입 시 IP 주소
  deviceFingerprint String? // 디바이스 핑거프린트 (해시값)
  userAgent         String? // User-Agent 헤더

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 관계
  affiliate User          @relation("AffiliateReferrals", ...)
  code      AffiliateCode @relation(...)
  subUser   User          @relation("ReferredUsers", ...)

  // 제약 조건
  @@unique([affiliateId, subUserId]) // 동일 어플리에이트가 같은 유저를 중복 추천 방지
  @@index([affiliateId])
  @@index([codeId])
  @@index([subUserId])
  @@index([affiliateId, codeId]) // 코드별 통계 조회용
  @@index([ipAddress, deviceFingerprint]) // 셀프 추천 감지용
}
```

### 주요 필드 설명

| 필드 | 타입 | 설명 | 제약 조건 |
|------|------|------|-----------|
| `id` | String | 레퍼럴 관계 고유 ID | cuid() 자동 생성 |
| `affiliateId` | String | 어플리에이트 사용자 ID | 필수, User 참조 |
| `codeId` | String | 사용된 AffiliateCode ID | 필수, AffiliateCode 참조 |
| `subUserId` | String | 피추천인 사용자 ID | 필수, User 참조 |
| `ipAddress` | String? | 가입 시 IP 주소 | 선택, 셀프 추천 감지용 |
| `deviceFingerprint` | String? | 디바이스 핑거프린트 | 선택, 셀프 추천 감지용 |
| `userAgent` | String? | User-Agent 헤더 | 선택, 셀프 추천 감지용 |

### 제약 조건
1. **중복 방지**: `@@unique([affiliateId, subUserId])` - 동일 어플리에이트가 같은 유저를 중복 추천 불가
2. **Cascade 삭제**: 어플리에이트나 코드가 삭제되면 관련 레퍼럴 관계도 자동 삭제

---

## 핵심 기능 정의

### 1. 레퍼럴 관계 생성 (Link Referral)

#### 기능 설명
회원가입 시 레퍼럴 코드를 통해 어플리에이트와 피추천인 간의 관계를 생성합니다.

#### 입력
- `subUserId`: 피추천인 사용자 ID (회원가입 완료 후 생성된 User ID)
- `referralCode`: 레퍼럴 코드 문자열 (예: "SUMMER2024")
- `trackingData`: 추적 정보
  - `ipAddress`: IP 주소
  - `deviceFingerprint`: 디바이스 핑거프린트
  - `userAgent`: User-Agent 헤더

#### 비즈니스 규칙
1. **코드 유효성 검증**
   - 코드가 존재하는지 확인
   - 코드가 활성화(`isActive = true`)되어 있는지 확인
   - 코드가 만료되지 않았는지 확인 (`expiresAt` 체크)

2. **셀프 추천 방지**
   - `affiliateId === subUserId`인 경우 예외 발생
   - 에러 메시지: "자신을 추천할 수 없습니다"

3. **중복 가입 방지**
   - `@@unique([affiliateId, subUserId])` 제약 조건으로 DB 레벨에서 방지
   - 이미 다른 어플리에이트 코드로 가입한 경우도 동일 어플리에이트의 다른 코드로는 가입 불가

4. **추적 정보 저장**
   - IP 주소, 디바이스 핑거프린트, User-Agent 저장
   - 향후 사기 탐지에 활용

#### 출력
- 생성된 `Referral` 엔티티

#### 예외 처리
- `ReferralCodeNotFoundException`: 코드가 존재하지 않음
- `ReferralCodeInactiveException`: 코드가 비활성화됨
- `ReferralCodeExpiredException`: 코드가 만료됨
- `SelfReferralException`: 자기 자신을 추천하려고 함
- `DuplicateReferralException`: 이미 레퍼럴 관계가 존재함

---

### 2. 레퍼럴 관계 조회 (Get Referrals)

#### 기능 설명
어플리에이트 사용자의 피추천인 목록을 조회합니다.

#### 입력
- `affiliateId`: 어플리에이트 사용자 ID
- `filters` (선택):
  - `codeId`: 특정 코드로 필터링
  - `startDate`: 시작 날짜
  - `endDate`: 종료 날짜
- `pagination`:
  - `page`: 페이지 번호
  - `limit`: 페이지당 항목 수

#### 출력
- 피추천인 목록 (페이지네이션 포함)
  - 각 항목: `Referral` 엔티티 + 관련 정보 (User, AffiliateCode)

---

### 3. 레퍼럴 관계 단일 조회 (Get Referral)

#### 기능 설명
특정 레퍼럴 관계를 ID로 조회합니다.

#### 입력
- `referralId`: 레퍼럴 관계 ID
- `affiliateId`: 어플리에이트 사용자 ID (권한 확인용)

#### 출력
- `Referral` 엔티티 + 관련 정보

#### 예외 처리
- `ReferralNotFoundException`: 레퍼럴 관계가 존재하지 않음
- `ReferralAccessDeniedException`: 다른 어플리에이트의 레퍼럴 관계 조회 시도

---

### 4. 레퍼럴 통계 조회 (Get Referral Stats)

#### 기능 설명
어플리에이트 사용자의 레퍼럴 통계를 조회합니다.

**⚠️ 통계 모듈 분리 고려사항:**
- **현재 단계**: referral 모듈에 포함 (단순 카운트 통계)
- **향후 확장**: 복잡한 통계는 별도 모듈로 분리 고려

#### 출력
- `totalReferrals`: 총 피추천인 수
- `referralsByCode`: 코드별 피추천인 수
- `recentReferrals`: 최근 피추천인 목록 (예: 최근 10명)

#### 통계 모듈 분리 기준
다음 조건이 충족되면 별도 모듈(`affiliate-stats`)로 분리 고려:
1. **복잡한 집계 로직**: 커미션 통계, Revenue 통계 등
2. **다중 데이터 소스**: Referral + Commission + Milestone 등
3. **대시보드 전용**: 실시간 차트, 기간별 분석 등
4. **성능 최적화 필요**: 별도 캐싱, 배치 집계 등

---

### 5. 셀프 추천 검증 (Validate Self Referral)

#### 기능 설명
셀프 추천 여부를 검증합니다.

#### 비즈니스 규칙
1. **기본 검증**: `affiliateId === subUserId` 체크
2. **고급 검증** (향후 구현):
   - 동일 IP 주소 체크
   - 동일 디바이스 핑거프린트 체크
   - 동일 User-Agent 체크

---

## 아키텍처 설계

### Hexagonal Architecture 패턴

기존 `code` 모듈과 동일한 구조를 따릅니다.

```
referral/
├── domain/                    # 비즈니스 로직 중심
│   ├── model/
│   │   └── referral.entity.ts      # Referral 도메인 엔티티
│   ├── referral-policy.ts          # 비즈니스 규칙 (Policy)
│   └── referral.exception.ts       # 도메인 예외
│
├── application/               # Use Case 레이어
│   ├── link-referral.service.ts    # 레퍼럴 관계 생성
│   ├── get-referral.service.ts     # 레퍼럴 관계 조회
│   ├── get-referrals.service.ts    # 레퍼럴 목록 조회
│   ├── get-referral-stats.service.ts # 통계 조회
│   └── validate-referral.service.ts # 검증 서비스
│
├── infrastructure/            # 외부 의존성 구현
│   ├── referral.repository.ts      # Prisma 기반 Repository 구현
│   └── referral.mapper.ts          # DB ↔ Domain 변환
│
├── ports/                     # 포트 (인터페이스)
│   └── out/
│       ├── referral.repository.port.ts    # Repository 인터페이스
│       └── referral.repository.token.ts   # DI 토큰
│
└── controllers/               # REST API
    ├── referral.controller.ts
    └── dto/
        ├── request/
        └── response/
```

---

### Domain Entity: Referral

#### 구조
```typescript
export class Referral {
  private constructor(
    public readonly id: string,
    public readonly affiliateId: string,
    public readonly codeId: string,
    public readonly subUserId: string,
    private readonly _ipAddress: string | null,
    private readonly _deviceFingerprint: string | null,
    private readonly _userAgent: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string;
    affiliateId: string;
    codeId: string;
    subUserId: string;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    userAgent?: string | null;
  }): Referral {
    // 비즈니스 규칙 검증
    // 셀프 추천 방지 등
    return new Referral(...);
  }

  static fromPersistence(data: {
    id: string;
    affiliateId: string;
    codeId: string;
    subUserId: string;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Referral {
    return new Referral(...);
  }

  // Getters
  get ipAddress(): string | null { return this._ipAddress; }
  get deviceFingerprint(): string | null { return this._deviceFingerprint; }
  get userAgent(): string | null { return this._userAgent; }

  // Business Logic Methods
  isSelfReferral(): boolean {
    return this.affiliateId === this.subUserId;
  }

  toPersistence() {
    return {
      id: this.id,
      affiliateId: this.affiliateId,
      codeId: this.codeId,
      subUserId: this.subUserId,
      ipAddress: this._ipAddress,
      deviceFingerprint: this._deviceFingerprint,
      userAgent: this._userAgent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
```

---

### Domain Policy: ReferralPolicy

#### 역할
비즈니스 규칙과 검증 로직을 담당합니다.

```typescript
export class ReferralPolicy {
  /**
   * 레퍼럴 관계 생성 가능 여부 검증
   */
  canCreateReferral(
    affiliateId: string,
    subUserId: string,
    code: AffiliateCode,
  ): void {
    // 1. 셀프 추천 방지
    if (affiliateId === subUserId) {
      throw new SelfReferralException();
    }

    // 2. 코드 활성화 확인
    if (!code.isActive) {
      throw new ReferralCodeInactiveException();
    }

    // 3. 코드 만료 확인
    if (code.isExpired()) {
      throw new ReferralCodeExpiredException();
    }
  }

  /**
   * 셀프 추천 여부 확인
   */
  isSelfReferral(affiliateId: string, subUserId: string): boolean {
    return affiliateId === subUserId;
  }
}
```

---

### Repository Interface

```typescript
export interface ReferralRepositoryPort {
  /**
   * 레퍼럴 관계 생성
   */
  create(params: {
    affiliateId: string;
    codeId: string;
    subUserId: string;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    userAgent?: string | null;
  }): Promise<Referral>;

  /**
   * ID로 레퍼럴 관계 조회
   */
  findById(id: string, affiliateId: string): Promise<Referral | null>;

  /**
   * 어플리에이트별 레퍼럴 목록 조회
   */
  findByAffiliateId(
    affiliateId: string,
    filters?: {
      codeId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: {
      page: number;
      limit: number;
    },
  ): Promise<{ data: Referral[]; total: number }>;

  /**
   * 피추천인별 레퍼럴 관계 조회
   */
  findBySubUserId(subUserId: string): Promise<Referral | null>;

  /**
   * 중복 레퍼럴 관계 존재 여부 확인
   */
  existsByAffiliateAndSubUser(
    affiliateId: string,
    subUserId: string,
  ): Promise<boolean>;

  /**
   * 코드별 레퍼럴 수 조회
   */
  countByCodeId(codeId: string): Promise<number>;

  /**
   * 어플리에이트별 총 레퍼럴 수 조회
   */
  countByAffiliateId(affiliateId: string): Promise<number>;
}
```

---

### Use Case Services

#### 1. LinkReferralService

```typescript
@Injectable()
export class LinkReferralService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly codeRepository: AffiliateCodeRepositoryPort,
    @Inject(REFERRAL_REPOSITORY)
    private readonly referralRepository: ReferralRepositoryPort,
    private readonly policy: ReferralPolicy,
  ) {}

  async execute(params: {
    subUserId: string;
    referralCode: string;
    trackingData: {
      ipAddress?: string;
      deviceFingerprint?: string;
      userAgent?: string;
    };
  }): Promise<Referral> {
    // 1. 코드 조회
    const code = await this.codeRepository.findByCode(params.referralCode);
    if (!code) {
      throw new ReferralCodeNotFoundException();
    }

    // 2. 비즈니스 규칙 검증
    this.policy.canCreateReferral(
      code.userId,
      params.subUserId,
      code,
    );

    // 3. 중복 체크
    const exists = await this.referralRepository.existsByAffiliateAndSubUser(
      code.userId,
      params.subUserId,
    );
    if (exists) {
      throw new DuplicateReferralException();
    }

    // 4. 레퍼럴 관계 생성
    const referral = Referral.create({
      id: generateId(), // cuid() 또는 uuid()
      affiliateId: code.userId,
      codeId: code.id,
      subUserId: params.subUserId,
      ipAddress: params.trackingData.ipAddress || null,
      deviceFingerprint: params.trackingData.deviceFingerprint || null,
      userAgent: params.trackingData.userAgent || null,
    });

    // 5. 저장
    return await this.referralRepository.create(referral.toPersistence());
  }
}
```

#### 2. GetReferralsService

```typescript
@Injectable()
export class GetReferralsService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
  ) {}

  async execute(params: {
    affiliateId: string;
    filters?: {
      codeId?: string;
      startDate?: Date;
      endDate?: Date;
    };
    pagination?: {
      page: number;
      limit: number;
    };
  }): Promise<{ data: Referral[]; total: number; page: number; limit: number }> {
    const result = await this.repository.findByAffiliateId(
      params.affiliateId,
      params.filters,
      params.pagination || { page: 1, limit: 20 },
    );

    return {
      data: result.data,
      total: result.total,
      page: params.pagination?.page || 1,
      limit: params.pagination?.limit || 20,
    };
  }
}
```

---

## 구현 우선순위

### Phase 1: 핵심 기능 (최우선) 🔴

1. **Domain Entity & Policy**
   - `Referral` 엔티티 구현
   - `ReferralPolicy` 구현
   - `ReferralException` 정의

2. **Repository**
   - `ReferralRepositoryPort` 인터페이스 정의
   - `ReferralRepository` 구현 (Prisma)
   - `ReferralMapper` 구현

3. **LinkReferralService**
   - 레퍼럴 관계 생성 서비스
   - 셀프 추천 방지
   - 중복 가입 방지

4. **Auth 모듈 연동**
   - `AuthService.register()`에서 `LinkReferralService` 호출
   - `RequestClientInfo`에서 추적 정보 추출

**예상 소요 시간**: 8-10시간

---

### Phase 2: 조회 기능 (높음) 🟡

1. **GetReferralService**
   - 단일 레퍼럴 관계 조회

2. **GetReferralsService**
   - 어플리에이트별 목록 조회
   - 필터링 및 페이지네이션

3. **GetReferralStatsService**
   - 통계 조회

**예상 소요 시간**: 6-8시간

---

### Phase 3: API & 테스트 (중간) 🟢

1. **Controller**
   - REST API 엔드포인트 구현
   - DTO 정의

2. **테스트**
   - 유닛 테스트
   - 통합 테스트

**예상 소요 시간**: 6-8시간

---

## 다른 모듈과의 연동

### 1. Auth 모듈

#### 연동 포인트
- `AuthService.register()` 메서드에서 회원가입 완료 후 레퍼럴 연결

#### 수정 필요 파일
```typescript
// src/modules/auth/application/auth.service.ts
async register(
  registerDto: RegisterDto,
  requestInfo: RequestClientInfo,
): Promise<AuthResponseDto> {
  // ... 기존 회원가입 로직 ...

  // 사용자 생성 후
  const user = await this.prisma.user.create({ ... });

  // 레퍼럴 코드가 있으면 연결
  if (registerDto.referralCode) {
    await this.linkReferralService.execute({
      subUserId: user.id,
      referralCode: registerDto.referralCode,
      trackingData: {
        ipAddress: requestInfo.ip,
        deviceFingerprint: requestInfo.fingerprint,
        userAgent: requestInfo.userAgent,
      },
    });
  }

  return { id: user.id, email: registerDto.email };
}
```

#### 의존성
- `AuthModule`에서 `AffiliateReferralModule` import
- `LinkReferralService` export 필요

---

### 2. Code 모듈

#### 연동 포인트
- `LinkReferralService`에서 코드 조회를 위해 `GetCodeByCodeService` 사용

#### 의존성
- `AffiliateReferralModule`에서 `AffiliateCodeModule` import (이미 완료)

---

### 3. User 모듈 (향후)

#### 연동 포인트
- 레퍼럴 통계 조회 시 User 정보 필요
- 피추천인 목록 조회 시 User 정보 포함

---

## 예외 처리

### Domain Exceptions

```typescript
// referral.exception.ts

export class ReferralException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferralException';
  }
}

export class SelfReferralException extends ReferralException {
  constructor() {
    super('자신을 추천할 수 없습니다');
    this.name = 'SelfReferralException';
  }
}

export class DuplicateReferralException extends ReferralException {
  constructor() {
    super('이미 레퍼럴 관계가 존재합니다');
    this.name = 'DuplicateReferralException';
  }
}

export class ReferralNotFoundException extends ReferralException {
  constructor(id?: string) {
    super(id ? `Referral '${id}' not found` : 'Referral not found');
    this.name = 'ReferralNotFoundException';
  }
}

export class ReferralAccessDeniedException extends ReferralException {
  constructor() {
    super('레퍼럴 관계에 대한 접근 권한이 없습니다');
    this.name = 'ReferralAccessDeniedException';
  }
}
```

---

## API 엔드포인트 (향후)

### 사용자용 API

```
GET    /api/v1/affiliate/referrals          # 내 피추천인 목록
GET    /api/v1/affiliate/referrals/:id     # 레퍼럴 관계 상세
GET    /api/v1/affiliate/referrals/stats   # 레퍼럴 통계
```

### 내부 API (Auth 모듈에서 사용)

```
POST   /api/v1/internal/referrals/link     # 레퍼럴 관계 생성 (회원가입 시)
```

---

## 테스트 전략

### 유닛 테스트

1. **Domain Entity 테스트**
   - `Referral.create()` 검증
   - 셀프 추천 방지 로직
   - `toPersistence()` 변환

2. **Policy 테스트**
   - `canCreateReferral()` 검증
   - 각종 예외 케이스

3. **Service 테스트**
   - `LinkReferralService` 테스트
   - Mock Repository 사용

### 통합 테스트

1. **레퍼럴 관계 생성 플로우**
   - 회원가입 → 레퍼럴 연결
   - 셀프 추천 방지
   - 중복 가입 방지

2. **레퍼럴 조회 플로우**
   - 목록 조회
   - 필터링 및 페이지네이션

---

## 통계 모듈 분리 전략

### 현재 접근: Referral 모듈 내 통계

**포함하는 통계:**
- ✅ 총 피추천인 수 (단순 COUNT)
- ✅ 코드별 피추천인 수 (GROUP BY)
- ✅ 최근 피추천인 목록 (ORDER BY + LIMIT)

**이유:**
1. **단순한 집계**: 단순 COUNT/GROUP BY 쿼리
2. **Referral 데이터만 사용**: 다른 모듈 의존성 없음
3. **YAGNI 원칙**: 현재 필요한 기능만 구현
4. **낮은 복잡도**: 통계 로직이 간단함

### 향후 분리 고려: Affiliate Stats 모듈

**분리 시점:**
다음 기능이 추가될 때 별도 모듈로 분리 고려:

1. **커미션 통계**
   - 총 커미션 금액
   - 기간별 커미션 추이
   - 게임 카테고리별 커미션

2. **Revenue 통계**
   - 총 House Revenue
   - 코드별 Revenue
   - Sub-ID별 Revenue

3. **복합 대시보드**
   - 실시간 차트 데이터
   - 기간별 비교 분석
   - 티어별 통계

4. **성능 최적화 필요**
   - 캐싱 전략
   - 배치 집계 작업
   - 별도 통계 테이블

**분리 시 구조:**
```
src/modules/affiliate/
├── code/              # 코드 관리
├── referral/          # 레퍼럴 관계 (통계 제거)
└── stats/            # 통계 전용 모듈 (신규)
    ├── application/
    │   ├── referral-stats.service.ts      # 레퍼럴 통계
    │   ├── commission-stats.service.ts    # 커미션 통계
    │   └── dashboard-stats.service.ts     # 대시보드 통계
    └── ...
```

**참고: 기존 프로젝트 패턴**
- `user-stats` 모듈: 사용자 잔액 통계를 별도 모듈로 분리
- 통계가 복잡해지면 별도 모듈로 분리하는 패턴 사용

### 권장사항

**현재 단계 (Phase 1-2):**
- ✅ referral 모듈에 통계 포함
- 단순한 카운트/집계만 구현

**향후 확장 (Phase 3+):**
- ⚠️ 커미션 통계 추가 시 별도 모듈 검토
- ⚠️ 복잡한 대시보드 필요 시 분리 고려

---

## 참고 사항

### 기존 명세서와의 차이점

1. **명세서의 `referrerId`, `refereeId` vs 스키마의 `affiliateId`, `subUserId`**
   - 실제 Prisma 스키마는 `affiliateId`, `subUserId` 사용
   - 문서에서는 스키마 기준으로 작성

2. **명세서의 `ReferralClick` 모델**
   - 현재 Prisma 스키마에 없음
   - 향후 클릭 추적 기능 추가 시 별도 구현 필요

3. **명세서의 `status` 필드**
   - 현재 Prisma 스키마에 없음
   - 향후 상태 관리 필요 시 추가

---

## 다음 단계

1. ✅ 모듈 구조 생성 (완료)
2. ⏳ Domain Entity 구현
3. ⏳ Repository 구현
4. ⏳ LinkReferralService 구현
5. ⏳ Auth 모듈 연동
6. ⏳ 테스트 작성

---

**작성일**: 2025-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0.0

