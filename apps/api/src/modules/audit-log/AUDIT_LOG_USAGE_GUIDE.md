# Audit Log 사용 가이드

이 문서는 audit-log 모듈의 각 로그 타입별로 어떤 로그를 남겨야 하는지 정의합니다.

## 로그 타입 개요

| 타입 | 큐 | 우선순위 | 용도 |
|------|-----|---------|------|
| **AUTH** | CRITICAL | 높음 | 보안/인증 관련 중요한 이벤트 |
| **INTEGRATION** | CRITICAL | 높음 | 외부 서비스 연동 (결제, 게임 등) |
| **ACTIVITY** | HEAVY | 낮음 | 사용자 활동 추적 (CS 대응용) |
| **ERROR** | HEAVY | 낮음 | 시스템 에러/예외 |

---

## 1. AUTH 로그 (AuthAuditLog)

**용도**: 보안 및 인증 관련 중요한 이벤트를 기록합니다. 데이터 양은 적지만 절대 누락되면 안 되는 보안 관련 로그입니다.

### 사용 시나리오

#### ✅ 기록해야 하는 경우

1. **로그인/로그아웃**
   - 사용자 로그인 성공/실패
   - 관리자 로그인 성공/실패
   - 로그아웃
   - 토큰 갱신

2. **비밀번호 관련**
   - 비밀번호 변경
   - 비밀번호 재설정 요청
   - 비밀번호 재설정 완료

3. **계정 보안**
   - 계정 잠금/해제
   - 계정 상태 변경 (활성화/비활성화)
   - 이메일 인증
   - 2FA 설정/해제

4. **권한 관련**
   - 권한 변경
   - 역할 변경

### 예시

```typescript
// 로그인 성공
await dispatchLogService.dispatch({
  type: LogType.AUTH,
  data: {
    userId: user.id.toString(),
    action: 'LOGIN',
    status: 'SUCCESS',
    ip: requestInfo.ip,
    userAgent: requestInfo.userAgent,
    metadata: {
      isAdmin: false,
      loginMethod: 'EMAIL',
    },
  },
});

// 로그인 실패
await dispatchLogService.dispatch({
  type: LogType.AUTH,
  data: {
    userId: user?.id?.toString(),
    action: 'LOGIN',
    status: 'FAILURE',
    ip: requestInfo.ip,
    userAgent: requestInfo.userAgent,
    metadata: {
      reason: 'INVALID_PASSWORD',
      attemptCount: 3,
    },
  },
});

// 비밀번호 변경
await dispatchLogService.dispatch({
  type: LogType.AUTH,
  data: {
    userId: user.id.toString(),
    action: 'PASSWORD_CHANGE',
    status: 'SUCCESS',
    ip: requestInfo.ip,
    userAgent: requestInfo.userAgent,
  },
});
```

### ❌ 기록하지 말아야 하는 경우

- 일반적인 사용자 활동 (프로필 조회, 게임 실행 등) → ACTIVITY 로그 사용
- 비즈니스 로직 관련 활동 → ACTIVITY 로그 사용

---

## 2. ACTIVITY 로그 (ActivityLog)

**용도**: 사용자 활동을 추적하여 CS 대응 및 사용자 행동 분석에 사용합니다. 데이터 양이 많지만 시스템 운영에 치명적이지 않습니다.

### 사용 시나리오

#### ✅ 기록해야 하는 경우

1. **프로필 관련**
   - 프로필 조회
   - 프로필 수정
   - 국가 변경

2. **게임 관련**
   - 게임 실행
   - 게임 종료

3. **입출금 관련**
   - 입금 요청
   - 출금 요청
   - 입출금 내역 조회
   - 관리자 입금 승인/거부

4. **프로모션 관련**
   - 프로모션 조회
   - 프로모션 상세 조회
   - 프로모션 히스토리 조회

5. **레퍼럴 관련**
   - 레퍼럴 코드 생성
   - 레퍼럴 코드 비활성화
   - 레퍼럴 보너스 획득
   - 레퍼럴 보너스 수령

6. **어필리에이트 관련**
   - 어필리에이트 링크 생성/수정/삭제
   - 어필리에이트 코드 생성/수정/삭제
   - 커미션 출금
   - 커미션 요율 설정

7. **기타 사용자 활동**
   - 통화 목록 조회
   - 지갑 주소 검증
   - 기타 사용자가 수행하는 주요 액션

### 예시

```typescript
// 게임 실행
await dispatchLogService.dispatch({
  type: LogType.ACTIVITY,
  data: {
    userId: user.id.toString(),
    category: 'GAME',
    action: 'GAME_LAUNCH',
    metadata: {
      gameId: 'pragmatic-play-slot-1',
      provider: 'PRAGMATIC_PLAY',
    },
  },
});

// 입금 요청
await dispatchLogService.dispatch({
  type: LogType.ACTIVITY,
  data: {
    userId: user.id.toString(),
    category: 'PAYMENT',
    action: 'DEPOSIT_REQUEST',
    metadata: {
      amount: '1000',
      currency: 'USD',
      method: 'CRYPTO_WALLET',
    },
  },
});

// 프로필 수정
await dispatchLogService.dispatch({
  type: LogType.ACTIVITY,
  data: {
    userId: user.id.toString(),
    category: 'PROFILE',
    action: 'PROFILE_UPDATE',
    metadata: {
      changedFields: ['nickname', 'country'],
    },
  },
});
```

### Category 예시

- `AUTH` - 인증 관련 활동 (로그인/로그아웃은 AUTH 로그 사용)
- `PROFILE` - 프로필 관련
- `GAME` - 게임 관련
- `PAYMENT` - 입출금 관련
- `PROMOTION` - 프로모션 관련
- `REFERRAL` - 레퍼럴 관련
- `AFFILIATE` - 어필리에이트 관련
- `WALLET` - 지갑 관련
- `ADMIN` - 관리자 활동

---

## 3. ERROR 로그 (SystemErrorLog)

**용도**: 시스템 에러 및 예외를 기록합니다. 디버깅 및 모니터링에 사용됩니다.

### 사용 시나리오

#### ✅ 기록해야 하는 경우

1. **예외 처리**
   - 예상치 못한 예외 발생
   - 비즈니스 로직 에러
   - 데이터 검증 실패

2. **외부 서비스 에러**
   - 외부 API 호출 실패 (Integration 로그와 함께 사용)
   - 타임아웃
   - 네트워크 에러

3. **시스템 경고**
   - 성능 저하
   - 리소스 부족
   - 비정상적인 패턴 감지

### Severity 레벨

- `INFO`: 정보성 로그 (예: 비즈니스 규칙 위반)
- `WARN`: 경고 (예: 성능 저하, 재시도 필요)
- `ERROR`: 에러 (예: 예외 발생, 처리 실패)
- `CRITICAL`: 치명적 에러 (예: 시스템 다운 위험)

### 예시

```typescript
// 예외 발생
try {
  await someOperation();
} catch (error) {
  await dispatchLogService.dispatch({
    type: LogType.ERROR,
    data: {
      userId: user?.id?.toString(),
      errorCode: 'PAYMENT_PROCESSING_FAILED',
      errorMessage: error.message,
      stackTrace: error.stack,
      path: request.path,
      method: request.method,
      severity: 'ERROR',
      metadata: {
        requestId: request.id,
        amount: request.body.amount,
      },
    },
  });
}

// 비즈니스 규칙 위반
if (!isValid) {
  await dispatchLogService.dispatch({
    type: LogType.ERROR,
    data: {
      userId: user.id.toString(),
      errorCode: 'INSUFFICIENT_BALANCE',
      errorMessage: '잔액이 부족합니다',
      path: request.path,
      method: request.method,
      severity: 'INFO',
      metadata: {
        requiredAmount: 1000,
        currentBalance: 500,
      },
    },
  });
}
```

---

## 4. INTEGRATION 로그 (IntegrationLog)

**용도**: 외부 서비스(결제 게이트웨이, 게임 프로바이더 등)와의 연동을 기록합니다. 정산 및 장애 대조에 사용됩니다.

### 사용 시나리오

#### ✅ 기록해야 하는 경우

1. **결제 게이트웨이**
   - 입금 처리 API 호출
   - 출금 처리 API 호출
   - 결제 상태 조회

2. **게임 프로바이더**
   - 게임 세션 생성
   - 게임 결과 조회
   - 베팅 처리

3. **외부 API 호출**
   - 환율 조회
   - SMS 발송
   - 이메일 발송
   - 기타 외부 서비스 연동

### Provider 예시

- `NOW_PAYMENT` - NowPayment 결제 게이트웨이
- `PRAGMATIC_PLAY` - Pragmatic Play 게임 프로바이더
- `EVOLUTION` - Evolution 게임 프로바이더
- `WHITECLIFF` - Whitecliff 게임 프로바이더
- `DCS` - DCS 게임 프로바이더
- `EXCHANGE_RATE` - 환율 조회 서비스

### 예시

```typescript
// 결제 게이트웨이 호출
const startTime = Date.now();
try {
  const response = await paymentGateway.createDeposit({
    amount: 1000,
    currency: 'USD',
  });
  
  const duration = Date.now() - startTime;
  
  await dispatchLogService.dispatch({
    type: LogType.INTEGRATION,
    data: {
      userId: user.id.toString(),
      provider: 'NOW_PAYMENT',
      method: 'POST',
      endpoint: '/api/v1/deposit',
      statusCode: response.status,
      duration,
      success: true,
    },
  });
} catch (error) {
  const duration = Date.now() - startTime;
  
  await dispatchLogService.dispatch({
    type: LogType.INTEGRATION,
    data: {
      userId: user.id.toString(),
      provider: 'NOW_PAYMENT',
      method: 'POST',
      endpoint: '/api/v1/deposit',
      statusCode: error.response?.status,
      duration,
      success: false,
    },
  });
}

// 게임 프로바이더 호출
await dispatchLogService.dispatch({
  type: LogType.INTEGRATION,
  data: {
    userId: user.id.toString(),
    provider: 'PRAGMATIC_PLAY',
    method: 'POST',
    endpoint: '/api/game/launch',
    statusCode: 200,
    duration: 150,
    success: true,
  },
});
```

---

## 로그 타입 선택 가이드

### 의사결정 트리

```
로그를 남겨야 하는가?
├─ 보안/인증 관련인가?
│  └─ YES → AUTH 로그
│
├─ 외부 서비스 API 호출인가?
│  └─ YES → INTEGRATION 로그
│
├─ 시스템 에러/예외인가?
│  └─ YES → ERROR 로그
│
└─ 사용자 활동인가?
   └─ YES → ACTIVITY 로그
```

### 중복 기록

일부 경우 여러 로그 타입을 동시에 기록할 수 있습니다:

- **외부 API 호출 실패**: INTEGRATION 로그 (API 호출 정보) + ERROR 로그 (에러 상세)
- **보안 관련 활동**: AUTH 로그 (보안 이벤트) + ACTIVITY 로그 (사용자 활동)

---

## 사용 예시

### 모듈에서 사용하기

```typescript
import { Inject } from '@nestjs/common';
import { DispatchLogService } from '../audit-log/application/dispatch-log.service';
import { LogType } from '../audit-log/domain';

@Injectable()
export class SomeService {
  constructor(
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async someOperation() {
    // 로그인 성공 시
    await this.dispatchLogService.dispatch({
      type: LogType.AUTH,
      data: {
        userId: user.id.toString(),
        action: 'LOGIN',
        status: 'SUCCESS',
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
      },
    });

    // 게임 실행 시
    await this.dispatchLogService.dispatch({
      type: LogType.ACTIVITY,
      data: {
        userId: user.id.toString(),
        category: 'GAME',
        action: 'GAME_LAUNCH',
        metadata: { gameId: 'slot-1' },
      },
    });
  }
}
```

---

## 주의사항

1. **성능**: 로그 기록은 비동기 큐를 통해 처리되므로 메인 로직에 영향을 주지 않습니다.
2. **에러 처리**: 로그 기록 실패는 시스템에 영향을 주지 않도록 조용히 처리됩니다.
3. **데이터 양**: ACTIVITY 로그는 데이터 양이 많을 수 있으므로 필요한 경우에만 기록하세요.
4. **민감 정보**: 민감한 정보(비밀번호, 토큰 등)는 metadata에 포함하지 마세요.

