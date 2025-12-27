---
description: DPC 백엔드 프로젝트 테스트 작성 가이드
globs: **/*.spec.ts
---

# 테스트 작성 가이드

## 테스트 유형 및 목적

- **단위 테스트**: 비즈니스 로직(도메인)이 의도대로 작동하는가? (순수 로직)
- **통합 테스트**: 외부 시스템(DB 등)과 통신이 제대로 이루어지는가? (어댑터 검증)
- **E2E 테스트**: 사용자의 요청부터 응답까지 전체 흐름이 완벽한가? (전체 시스템)

**파일 위치**:
- 단위: 소스 파일과 같은 디렉토리 (`*.spec.ts`)
- 통합: `test/integration/` (`*.integration.spec.ts`)
- E2E: `test/` (`*.e2e-spec.ts`)

---

## 코드 골든 룰 (Do & Don't)

### ✅ 구조 및 네이밍

**Given-When-Then 패턴을 주석으로 명시하여 흐름을 분리한다**:

```typescript
it('잔액이 부족하면 InsufficientBalanceException을 던진다', () => {
  // Given
  const wallet = createMockWallet({ balance: new Prisma.Decimal('100') });
  
  // When & Then
  expect(() => wallet.withdraw(new Prisma.Decimal('150')))
    .toThrow(InsufficientBalanceException);
});
```

**it() 설명은 한글로, "~한다" 또는 "~일 때 ~를 던진다"와 같이 동작 중심으로 작성한다**:
- ✅ `it('새 커미션 엔티티를 생성한다', ...)`
- ✅ `it('잔액이 부족하면 InsufficientBalanceException을 던진다', ...)`
- ✅ `it('정산 불가능한 상태에서 정산을 시도하면 예외를 발생시킨다', ...)`

### ✅ 금융 데이터 (Prisma.Decimal)

**검증: toBe() 사용 금지. 반드시 .equals() 또는 .toString()을 사용한다**:

```typescript
// ✅ Good
expect(result.amount.equals(new Prisma.Decimal('100'))).toBe(true);
expect(result.amount.toString()).toBe('100');

// ❌ Bad
expect(result.amount).toBe(new Prisma.Decimal('100')); // 작동하지 않음
```

**정밀도: 테스트 코드에서도 number 대신 new Prisma.Decimal('값') 문자열 생성을 지향하여 오차를 방지한다**:

```typescript
// ✅ Good
const mockAmount = new Prisma.Decimal('10000.50');

// ❌ Bad
const mockAmount = new Prisma.Decimal(10000.50); // 정밀도 손실 가능
```

### ✅ 시간 고정 (Time Mocking)

**날짜/시간 검증이 포함된 경우 반드시 jest.setSystemTime()으로 시간을 고정한다**:

```typescript
describe('AffiliateCommission Entity', () => {
  const mockDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('생성 시 createdAt이 현재 시간으로 설정된다', () => {
    const commission = AffiliateCommission.create({ /* ... */ });
    expect(commission.createdAt).toEqual(mockDate);
  });
});
```

**beforeEach에서 useFakeTimers, afterEach에서 useRealTimers를 철저히 관리한다**

### ❌ 테스트 코드에 복잡한 로직 금지

```typescript
// ✅ Good: 단일 책임, 명확한 검증
it('잔액이 부족하면 InsufficientBalanceException을 던진다', () => {
  const wallet = createMockWallet({ balance: new Prisma.Decimal('100') });
  expect(() => wallet.withdraw(new Prisma.Decimal('150')))
    .toThrow(InsufficientBalanceException);
});

// ❌ Bad: 복잡한 로직 포함
it('반복문으로 여러 상태 테스트', () => {
  for (const s of status) {
    if (s === 'A') { /* ... */ } // 테스트 코드 내 제어문 금지
  }
});
```

---

## 단위 테스트 작성

### 기본 구조

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('새 엔티티를 생성한다', () => {
      // Given
      const params = { /* ... */ };

      // When
      const result = ClassName.create(params);

      // Then
      expect(result.id).toBeNull();
      expect(result.status).toBe(Status.PENDING);
    });
  });
});
```

### 도메인 엔티티 테스트

- ✅ **팩토리 메서드**: `create()`, `fromPersistence()`
- ✅ **비즈니스 로직**: 상태 변경 메서드들 (`settle()`, `claim()`, `withdraw()`, `cancel()`)
- ✅ **검증 메서드**: `canSettle()`, `canClaim()`, `canCancel()`
- ✅ **예외 케이스**: 잘못된 상태에서의 동작 시도
- ✅ **Native 타입 우선 사용**: 외부 라이브러리에 의존하지 않고 Native 타입을 우선적으로 사용

### Application Service 테스트

Repository와 Policy를 Mock하여 테스트:

```typescript
describe('CreateCodeService', () => {
  let service: CreateCodeService;
  let repository: jest.Mocked<AffiliateCodeRepositoryPort>;

  beforeEach(() => {
    repository = { findByUserId: jest.fn(), create: jest.fn() } as any;
    service = new CreateCodeService(repository, policy);
  });

  it('새 어필리에이트 코드를 생성한다', async () => {
    repository.findByUserId.mockResolvedValue([]);
    const newCode = AffiliateCode.create({ /* ... */ });
    repository.create.mockResolvedValue(newCode);

    const result = await service.execute({ userId: 'user-123' });
    expect(result).toBe(newCode);
  });
});
```

---

## Mock 데이터 작성

### Mock 데이터 팩토리 함수

반복되는 Mock 데이터는 팩토리 함수로 추출:

```typescript
export const createMockWallet = (overrides?: Partial<AffiliateWallet>) => {
  return AffiliateWallet.fromPersistence({
    id: BigInt(1),
    uid: 'wallet-123',
    affiliateId: 'affiliate-123',
    currency: ExchangeCurrencyCode.USD,
    availableBalance: new Prisma.Decimal('0'),
    ...overrides,
  });
};
```

### 기타 타입

```typescript
const mockId = BigInt(1);
const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
const mockCurrency = ExchangeCurrencyCode.USD;
const mockStatus = CommissionStatus.PENDING;
```

---

## 이것만은 피하자

### ❌ 하나의 it()에서 너무 많은 것을 검증하지 말 것

```typescript
// ❌ Bad
it('커미션을 생성하고 정산하고 출금한다', () => { /* ... */ });

// ✅ Good
it('새 커미션 엔티티를 생성한다', () => { /* ... */ });
it('정산 가능한 상태에서 정산을 처리한다', () => { /* ... */ });
```

### ❌ 실제 DB 연결이 필요한 테스트를 단위 테스트에서 수행하지 말 것

```typescript
// ❌ Bad: 단위 테스트에서 DB 사용
it('DB에 커미션을 저장한다', async () => {
  await prisma.affiliateCommission.create({ /* ... */ });
});

// ✅ Good: 통합 테스트에서 DB 사용
// test/integration/commission/commission.repository.integration.spec.ts
it('DB에 커미션을 저장하고 조회한다', async () => {
  const created = await repository.create(commission);
  expect(created.id).not.toBeNull();
});
```

---

## 테스트 커버리지

- ✅ **도메인 엔티티**: 100% 커버리지 목표
- ✅ **Application Service**: 주요 Use Case 시나리오 테스트
- ✅ **예외 케이스**: 정상 케이스뿐만 아니라 예외 케이스도 테스트

```bash
npm run test:cov
```

---

## 테스트 실행 명령어

```bash
npm run test              # 단위 테스트 실행
npm run test:dev         # 테스트 감시 모드
npm run test:cov          # 커버리지 확인
npm run test:integration  # 통합 테스트 실행
npm run test:e2e          # E2E 테스트 실행
```

---

## 관련 문서

- [경량 헥사고날 아키텍처 가이드](./lightweight-hexagonal-architecture.md): 아키텍처 패턴
