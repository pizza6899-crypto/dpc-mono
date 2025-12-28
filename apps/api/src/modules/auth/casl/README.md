# CASL 권한 관리 모듈

## 개요

CASL(Capability-based Access Control Library)을 사용하여 역할 기반 접근 제어(RBAC)를 구현합니다.

## 구조

경량 헥사고날 아키텍처 원칙을 따릅니다:

```
casl/
├── domain/                    # 도메인 레이어 (순수 비즈니스 로직)
│   ├── model/                 # 타입 정의
│   ├── policy.ts              # 권한 정책
│   └── exception.ts           # 도메인 예외
├── application/               # 애플리케이션 레이어 (Use Cases)
│   └── define-abilities.service.ts
├── infrastructure/            # 인프라 레이어 (CASL 통합)
│   └── casl-ability.factory.ts
├── guards/                    # Guard (NestJS 특화)
│   └── casl-ability.guard.ts
├── decorators/                # Decorator (NestJS 특화)
│   └── check-ability.decorator.ts
└── casl.module.ts
```

## 사용 방법

### 1. 모듈 등록

`auth.module.ts`에 `CaslModule`을 import합니다:

```typescript
@Module({
  imports: [
    // ...
    CaslModule,
  ],
})
export class AuthModule {}
```

### 2. 컨트롤러에서 사용

```typescript
import { Controller, Patch, UseGuards } from '@nestjs/common';
import { CaslAbilityGuard } from '../casl/guards/casl-ability.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { Action, SubjectType } from '../casl/domain';

@Controller('users')
export class UserController {
  @Patch(':id')
  @UseGuards(CaslAbilityGuard)
  @CheckAbility(Action.UPDATE, SubjectType.USER)
  async updateUser(@Param('id') id: string) {
    // 권한 검증 통과 시 실행
  }
}
```

### 3. 조건부 권한 검증

컨트롤러에서 리소스 객체를 전달하여 조건부 권한을 검증할 수 있습니다:

```typescript
@Patch(':id')
@UseGuards(CaslAbilityGuard)
@CheckAbility(Action.UPDATE, SubjectType.USER)
async updateUser(
  @Param('id') id: string,
  @Req() req: Request,
) {
  const ability = (req as any).ability; // Guard에서 저장한 Ability
  const user = await this.userService.findById(id);
  
  // 리소스 객체로 조건부 권한 검증
  if (!ability.can(Action.UPDATE, user)) {
    throw new ForbiddenException();
  }
  
  // ...
}
```

## 권한 정책

`CaslPolicy`에서 역할별 권한을 정의합니다:

- **SUPER_ADMIN**: 모든 리소스에 대한 모든 액션
- **ADMIN**: 대부분의 리소스 관리 (일부 제한)
- **AGENT**: 어필리에이트 관련 리소스만 관리 (자신의 리소스만)
- **USER**: 기본 읽기 및 자신의 리소스만 관리

## 주의사항

1. **기존 `@RequireRoles()`와의 호환성**
   - 기존 코드는 그대로 동작합니다
   - 점진적으로 CASL로 마이그레이션 가능

2. **Guard 순서**
   - `SessionAuthGuard` 다음에 `CaslAbilityGuard`를 사용
   - 인증이 먼저 완료되어야 권한 검증 가능

3. **조건부 권한**
   - 템플릿 문자열 `${user.id}`를 사용하여 동적 조건 정의
   - 예: `{ userId: '${user.id}' }` → 자신의 리소스만 접근 가능

