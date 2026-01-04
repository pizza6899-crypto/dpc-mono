# Audit Log 인터셉터 사용 가이드

`@AuditLog()` 데코레이터를 사용하면 서비스 메서드에서 audit log를 자동으로 기록할 수 있습니다.

## 기본 사용법

### 1. 인터셉터 등록

인터셉터를 사용하려면 모듈에 등록해야 합니다.

#### 방법 A: 전역 등록 (권장)

`app.module.ts`에서 전역으로 등록하면 모든 모듈에서 사용할 수 있습니다:

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './modules/audit-log/infrastructure/audit-log.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
```

#### 방법 B: 모듈별 등록

특정 모듈에서만 사용하려면 해당 모듈에 등록:

```typescript
import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { AuditLogInterceptor } from 'src/modules/audit-log/infrastructure/audit-log.interceptor';

@Module({
  imports: [AuditLogModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class YourModule {}
```

### 2. 데코레이터 사용

서비스 메서드에 `@AuditLog()` 데코레이터를 추가합니다:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@Injectable()
export class LoginService {
  @AuditLog({
    type: LogType.AUTH,
    action: 'LOGIN',
  })
  async execute({ user, clientInfo }: LoginParams): Promise<void> {
    // 로그인 로직
    // 성공/실패 여부에 따라 자동으로 audit log 기록
  }
}
```

## 고급 사용법

### 커스텀 메타데이터 추출

추가 메타데이터를 기록하려면:

```typescript
@AuditLog({
  type: LogType.AUTH,
  action: 'PASSWORD_CHANGE',
  extractMetadata: (_, args, result, error) => {
    const [params] = args;
    return {
      isAdmin: params.isAdmin,
      email: params.user.email,
      changedBy: params.changedBy,
      // 에러 발생 시 에러 정보 포함
      ...(error && { errorCode: error.code }),
    };
  },
})
async execute({ user, isAdmin, changedBy }: ChangePasswordParams): Promise<void> {
  // ...
}
```

### ACTIVITY 로그 사용

```typescript
@AuditLog({
  type: LogType.ACTIVITY,
  action: 'COMMISSION_WITHDRAW',
  category: 'AFFILIATE',
  extractMetadata: (_, args) => {
    const [params] = args;
    return {
      affiliateId: params.affiliateId.toString(),
      currency: params.currency,
      amount: params.amount.toString(),
    };
  },
})
async execute({ affiliateId, currency, amount }: WithdrawParams): Promise<Wallet> {
  // ...
}
```

### 성공/실패 로그 제어

기본적으로 성공과 실패 모두 로그를 기록합니다. 특정 경우만 기록하려면:

```typescript
// 성공 시에만 기록
@AuditLog({
  type: LogType.AUTH,
  action: 'LOGIN',
  logOnSuccess: true,
  logOnError: false, // 실패 시 기록 안 함
})
async execute(): Promise<void> {
  // ...
}

// 실패 시에만 기록
@AuditLog({
  type: LogType.ERROR,
  action: 'PAYMENT_PROCESSING',
  logOnSuccess: false,
  logOnError: true,
})
async execute(): Promise<void> {
  // ...
}
```

## 기존 코드 마이그레이션

### Before (수동 로깅)

```typescript
@Injectable()
export class LoginService {
  constructor(
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({ user, clientInfo }: LoginParams): Promise<void> {
    try {
      // 로그인 로직
      await this.dispatchLogService.dispatch({
        type: LogType.AUTH,
        data: {
          userId: user.id.toString(),
          action: 'LOGIN',
          status: 'SUCCESS',
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          metadata: { isAdmin: false },
        },
      }, clientInfo);
    } catch (error) {
      await this.dispatchLogService.dispatch({
        type: LogType.AUTH,
        data: {
          userId: user.id.toString(),
          action: 'LOGIN',
          status: 'FAILURE',
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          metadata: { error: error.message },
        },
      }, clientInfo);
      throw error;
    }
  }
}
```

### After (인터셉터 사용)

```typescript
@Injectable()
export class LoginService {
  async execute({ user, clientInfo }: LoginParams): Promise<void> {
    // 로그인 로직만 집중
    // audit log는 자동으로 기록됨
  }
}
```

데코레이터 추가:

```typescript
@AuditLog({
  type: LogType.AUTH,
  action: 'LOGIN',
  extractMetadata: (_, args) => {
    const [params] = args;
    return { isAdmin: params.isAdmin };
  },
})
async execute({ user, clientInfo, isAdmin }: LoginParams): Promise<void> {
  // ...
}
```

## 주의사항

1. **RequestClientInfo 자동 추출**: 인터셉터는 `request.clientInfo`에서 자동으로 클라이언트 정보를 추출합니다. `RequestInfoInterceptor`가 먼저 실행되어야 합니다.

2. **비동기 처리**: audit log 기록은 비동기로 처리되며, 메서드 실행에 영향을 주지 않습니다. 기록 실패 시에도 에러를 throw하지 않습니다.

3. **트랜잭션**: audit log는 별도 큐에서 처리되므로 트랜잭션과 독립적입니다. 메인 로직의 트랜잭션 롤백과 무관하게 기록됩니다.

4. **userId 추출**: `req.user`가 있으면 자동으로 사용하고, 없으면 파라미터의 `userId`, `user.id`, `id`를 자동으로 찾습니다.

## 장점

- ✅ 코드 중복 제거: 각 서비스에서 반복되는 audit log 코드 제거
- ✅ 일관성: 모든 audit log가 동일한 방식으로 기록됨
- ✅ 유지보수성: audit log 로직 변경 시 한 곳만 수정
- ✅ 가독성: 비즈니스 로직에 집중 가능

