# CASL 모듈 구조

## 디렉토리 구조

```
auth/
  └── casl/
      ├── domain/                           # 도메인 레이어 (권한 정의 및 정책)
      │   ├── model/
      │   │   ├── ability.types.ts          # 권한 타입 정의 (Subject, Action 등)
      │   │   └── permission.types.ts      # 권한 값 객체 (선택적)
      │   ├── policy.ts                     # 권한 정책 (비즈니스 규칙)
      │   ├── exception.ts                  # 권한 관련 도메인 예외
      │   └── index.ts                      # Public API
      │
      ├── application/                      # 애플리케이션 레이어 (Use Cases)
      │   └── define-abilities.service.ts  # 사용자별 권한 정의 Use Case
      │
      ├── infrastructure/                   # 인프라 레이어 (CASL 통합)
      │   └── casl-ability.factory.ts      # CASL AbilityFactory 구현
      │
      ├── guards/                           # Guard (NestJS 특화)
      │   └── casl-ability.guard.ts        # CASL 기반 권한 검증 Guard
      │
      ├── decorators/                       # Decorator (NestJS 특화)
      │   └── check-ability.decorator.ts   # 권한 검증 데코레이터
      │
      └── casl.module.ts                    # NestJS 모듈
```

## 파일별 역할

### Domain Layer

#### `domain/model/ability.types.ts`
- CASL의 Subject, Action 타입 정의
- 리소스 타입 enum 정의
- 순수 TypeScript 타입만 사용 (CASL 라이브러리 의존 없음)

```typescript
// 예시
export enum SubjectType {
  USER = 'User',
  AFFILIATE_CODE = 'AffiliateCode',
  COMMISSION = 'Commission',
  // ...
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // 모든 액션
}

export type Subjects = SubjectType | 'all';
```

#### `domain/policy.ts`
- 권한 정책 비즈니스 규칙
- 역할별 권한 정의 로직
- 순수 TypeScript만 사용

```typescript
@Injectable()
export class CaslPolicy {
  /**
   * 역할별 기본 권한 정의
   */
  defineRolePermissions(role: UserRoleType): Permission[] {
    // 비즈니스 규칙에 따른 권한 정의
  }
}
```

#### `domain/exception.ts`
- 권한 관련 도메인 예외
- 예: `InsufficientPermissionException`

### Application Layer

#### `application/define-abilities.service.ts`
- 사용자별 권한 정의 Use Case
- Domain Policy를 사용하여 권한 정의
- Infrastructure의 AbilityFactory를 사용하여 CASL Ability 생성

```typescript
@Injectable()
export class DefineAbilitiesService {
  constructor(
    private readonly policy: CaslPolicy,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  async execute(user: AuthenticatedUser): Promise<Ability> {
    const permissions = this.policy.defineRolePermissions(user.role);
    return this.abilityFactory.create(user, permissions);
  }
}
```

### Infrastructure Layer

#### `infrastructure/casl-ability.factory.ts`
- CASL 라이브러리와의 통합
- AbilityFactory 구현
- CASL 라이브러리 의존성

```typescript
@Injectable()
export class CaslAbilityFactory {
  create(user: AuthenticatedUser, permissions: Permission[]): Ability {
    // CASL Ability 생성
  }
}
```

### Guards

#### `guards/casl-ability.guard.ts`
- CASL 기반 권한 검증 Guard
- `@CheckAbility()` 데코레이터와 함께 사용
- NestJS ExecutionContext 처리

```typescript
@Injectable()
export class CaslAbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly defineAbilitiesService: DefineAbilitiesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 권한 검증 로직
  }
}
```

### Decorators

#### `decorators/check-ability.decorator.ts`
- 권한 검증 데코레이터
- `@CheckAbility(Action.UPDATE, SubjectType.USER)` 형식

```typescript
export const CheckAbility = (action: Action, subject: Subjects) =>
  SetMetadata(CHECK_ABILITY_KEY, { action, subject });
```

## 모듈 등록

```typescript
// casl.module.ts
@Module({
  providers: [
    // Domain Policy
    CaslPolicy,
    
    // Application Service
    DefineAbilitiesService,
    
    // Infrastructure
    CaslAbilityFactory,
    
    // Guards
    CaslAbilityGuard,
  ],
  exports: [
    DefineAbilitiesService,
    CaslAbilityFactory,
    CaslAbilityGuard,
  ],
})
export class CaslModule {}
```

## 사용 예시

```typescript
// 컨트롤러에서 사용
@Controller('users')
export class UserController {
  @Patch(':id')
  @UseGuards(CaslAbilityGuard)
  @CheckAbility(Action.UPDATE, SubjectType.USER)
  async updateUser(@Param('id') id: string) {
    // ...
  }
}
```

