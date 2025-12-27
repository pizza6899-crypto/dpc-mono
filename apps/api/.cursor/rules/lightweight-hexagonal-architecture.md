---
description: 경량 헥사고날 아키텍처의 계층 구조와 의존성 방향 규칙
globs: src/modules/**/*.ts
---

# 경량 헥사고날 아키텍처 (Lightweight Hexagonal Architecture) 가이드

## 디렉토리 구조

모든 모듈은 다음 구조를 따라야 합니다:

```
module-name/
├── domain/                    # 도메인 레이어 (핵심 비즈니스 로직)
│   ├── model/                 # 엔티티, 값 객체
│   │   ├── entity.ts
│   │   └── value-object.ts
│   ├── policy.ts              # 도메인 정책 (비즈니스 규칙)
│   ├── exception.ts           # 도메인 예외
│   └── index.ts               # Public API
│
├── application/               # 애플리케이션 레이어 (Use Cases)
│   ├── create-code.service.ts
│   ├── find-codes.service.ts
│   ├── delete-code.service.ts
│   └── ...
│
├── ports/                     # 포트 정의 (인터페이스만) - Outbound Ports만 존재
│   ├── repository.port.ts
│   ├── repository.token.ts
│   └── index.ts
│
├── infrastructure/            # 인프라 구현 (Outbound Adapters)
│   ├── repository.ts          # Repository 구현 (Outbound Port 구현)
│   └── mapper.ts              # Domain ↔ DB 변환 (필요시)
│                              # ⚠️ Domain → Infrastructure 의존 금지
│                              # ✅ Infrastructure → Domain 의존만 허용
│
├── controllers/               # HTTP 컨트롤러 (Inbound Adapter)
│   ├── user/                  # 유저용 컨트롤러 (선택적)
│   │   ├── dto/
│   │   │   ├── request/       # 클라이언트 -> 서버
│   │   │   │   ├── create-module.dto.ts
│   │   │   │   └── update-module.dto.ts
│   │   │   └── response/       # 서버 -> 클라이언트
│   │   │       ├── module.response.dto.ts
│   │   │       └── module-list.response.dto.ts
│   │   └── module-user.controller.ts
│   └── admin/                 # 어드민용 컨트롤러 (선택적)
│       ├── dto/
│       │   ├── request/       # 클라이언트 -> 서버
│       │   │   ├── create-module.dto.ts
│       │   │   └── update-module.dto.ts
│       │   └── response/      # 서버 -> 클라이언트
│       │       ├── module.response.dto.ts
│       │       └── module-list.response.dto.ts
│       └── module-admin.controller.ts
│   # 참고: 유저/어드민 구분이 없는 경우 controllers/ 바로 아래에 배치 가능
│
├── schedulers/                # 스케줄러 (Inbound Adapter)
│   ├── task-name.scheduler.ts
│   └── ...
│
└── module-name.module.ts      # NestJS 모듈
```

## 레이어별 역할 및 규칙

### 1. Domain (도메인 레이어)

**역할**: 순수한 비즈니스 로직과 규칙을 담당합니다. 외부 의존성이 없어야 합니다.

**규칙**:
- ✅ 외부 라이브러리 의존 없음 (Prisma, HTTP 클라이언트 등)
- ✅ **예외: Prisma.Decimal과 Prisma enum 타입은 허용**
  - `Prisma.Decimal`: 금액/비율 등 소수점 연산이 필요한 필드에서 사용 (맵핑 복잡도와 정밀도 손실 방지)
  - `Prisma enum`: 타입 안정성을 위한 enum 타입 (예: `ExchangeCurrencyCode`, `CommissionStatus`)
  - **Prisma.Decimal 연산 규칙**: `+`, `-`, `*`, `/` 연산자 대신 `.add()`, `.sub()`, `.mul()`, `.div()` 메서드 사용 필수
- ✅ 순수 TypeScript 클래스와 인터페이스만 사용
- ✅ 도메인 엔티티는 불변성(immutability) 고려
- ✅ 비즈니스 규칙은 도메인 엔티티나 Policy에 포함
- ✅ **도메인 엔티티는 생성자를 private으로 제한하고, 반드시 static create()와 같은 팩토리 메서드를 통해 생성하여 도메인 규칙을 강제한다**
- ✅ **팩토리 메서드에서 ID는 선택적 파라미터로 받으며, 새 엔티티 생성 시 ID 없이 생성하고 DB 저장 시 자동 생성된 ID를 사용한다**
- ✅ **`domain/index.ts` (Public API)를 통해 외부에 노출할 항목만 export**
- ✅ **외부 레이어(Application, Infrastructure)에서 Domain을 참조할 때는 가급적 `index.ts`를 통해 참조한다**
  - 예: `import { AffiliateCode, AffiliateCodePolicy } from '../../domain'` (권장)
  - 예: `import { AffiliateCode } from '../../domain/model/entity'` (비권장)
- ✅ **도메인 예외(`DomainException`)를 사용하여 유저에게 예외를 처리할 때, 예외 메시지는 항상 영어로 작성한다**

**예시**:
```typescript
// domain/model/entity.ts
export class AffiliateCode {
  private constructor(
    public readonly id: bigint | null,    // 내부 관리용 (DB 저장 시 자동 생성)
    public readonly uid: string | null,   // 비즈니스용 (CUID2, DB 저장 시 자동 생성)
    private _code: AffiliateCodeValue,
  ) {}

  static create(params: { id?: bigint; uid?: string; code: string; ... }): AffiliateCode {
    // 팩토리 메서드로 생성 (새 엔티티는 id=null, uid만 설정)
    // DB 저장 시 id와 uid 모두 자동 생성됨
  }

  canBeDeleted(totalCodes: number): boolean {
    // 비즈니스 규칙 검증
  }
}

// domain/index.ts (Public API)
export { AffiliateCode } from './model/entity';
export { AffiliateCodeValue } from './model/affiliate-code-value';
export { AffiliateCodePolicy } from './affiliate-code-policy';
export { AffiliateCodeException, AffiliateCodeNotFoundException } from './affiliate-code.exception';

// domain/affiliate-code.exception.ts
export class AffiliateCodeNotFoundException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Affiliate code not found: ${identifier}`); // ✅ 메시지는 항상 영어로 작성
  }
}
```

**외부 레이어에서 Domain 참조 예시**:
```typescript
// application/create-code.service.ts
// ✅ 권장: index.ts를 통해 참조
import { AffiliateCode, AffiliateCodePolicy } from '../../domain';

// ❌ 비권장: 직접 경로 참조
// import { AffiliateCode } from '../../domain/model/entity';
```

## 식별자 정책 (Hybrid Identity)

**이중 식별자 구조**: 모든 엔티티는 내부 관리용 `id` (BigInt)와 비즈니스용 `uid` (CUID2)를 모두 가진다.

**도메인 엔티티**:
- ✅ 생성 시에는 `uid`만 가지며 `id`는 `null`이다
- ✅ 영속화된 엔티티(Rehydrated)는 두 식별자를 모두 보유한다

**노출 원칙**:
- ✅ **Client API**: `uid`만 노출하고 이를 기반으로 요청을 받는다
- ✅ **Admin API / 운영툴**: 운영 편의를 위해 `id`와 `uid`를 모두 노출할 수 있다

**조회(Repository)**:
- ✅ 기본: `findByUid`, `getByUid` 사용
- ✅ 어드민 전용 Use Case에서는 `findById`, `getById` 사용 허용

**예시**:
```typescript
// domain/model/entity.ts
export class AffiliateCode {
  private constructor(
    public readonly id: bigint | null,    // 내부 관리용 (DB 저장 시 자동 생성)
    public readonly uid: string | null,   // 비즈니스용 (CUID2, DB 저장 시 자동 생성)
    private _code: AffiliateCodeValue,
  ) {}

  static create(params: { id?: bigint; uid?: string; code: string; ... }): AffiliateCode {
    // 새 엔티티 생성 시: id=null, uid만 설정 (DB 저장 시 자동 생성)
    // 영속화된 엔티티: id와 uid 모두 보유
  }
}

// infrastructure/repository.ts
// 기본 조회: uid 사용
async findByUid(uid: string): Promise<AffiliateCode | null> {
  const result = await this.tx.affiliateCode.findUnique({ where: { uid } });
  return result ? this.mapper.toDomain(result) : null;
}

// 어드민 전용: id 사용
async findById(id: bigint): Promise<AffiliateCode | null> {
  const result = await this.tx.affiliateCode.findUnique({ where: { id } });
  return result ? this.mapper.toDomain(result) : null;
}
```

### 2. Application (애플리케이션 레이어)

**역할**: Use Case를 구현합니다. 각 Use Case는 별도의 서비스 클래스로 분리합니다.

**구조**:
- ✅ `application/` 폴더 바로 아래에 Use Case별 서비스 파일 배치
  - 각 Use Case는 단일 책임 원칙을 따르는 독립적인 서비스
  - 예: `create-code.service.ts`, `find-codes.service.ts`
- ✅ 파일명은 `kebab-case.service.ts` 형식 (예: `create-code.service.ts`)

**Use Case 서비스 네이밍 규칙**:
- ✅ **조회 계열**: `Find*` 사용 (Repository 네이밍 규칙과 일치)
  - 예: `FindCodesService`, `FindCodeByIdService`, `FindCodeByCodeService`
- ✅ **CRUD 계열**: `Create*`, `Update*`, `Delete*` 사용
  - 예: `CreateCodeService`, `UpdateCodeService`, `DeleteCodeService`
- ✅ **비즈니스 액션**: 동사 + 엔티티명 + 명사 패턴으로 Use Case 명확히 표현
  - 예: `ToggleCodeActiveService`, `IncrementCodeUsageService`, `SetCodeAsDefaultService`
- ✅ **검증**: `Validate*` 사용
  - 예: `ValidateCodeFormatService`

**규칙**:
- ✅ 각 Use Case 서비스는 하나의 Use Case만 담당 (단일 책임 원칙)
- ✅ Outbound Port(인터페이스)에만 의존, 구현체에 의존하지 않음
- ✅ 도메인 엔티티를 직접 반환
- ✅ 트랜잭션 관리, 오케스트레이션 담당
- ✅ 여러 Use Case가 공통 의존성을 필요로 하면 생성자에서 주입
- ✅ **서비스의 `execute` 메서드는 별도의 DTO 클래스 대신, 서비스 파일 상단에 정의된 `interface`나 `type`을 인자로 받는다**
- ✅ **`execute` 메서드에서는 구조 분해 할당(Destructuring)을 사용하여 코드 가독성을 높인다**
- ✅ **컨트롤러는 자신의 DTO를 이 인터페이스 형식에 맞춰 전달한다**

**예시**:
```typescript
// application/create-code.service.ts
import { AffiliateCode, AffiliateCodePolicy } from '../../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/affiliate-code.repository.token';
import { AffiliateCodeRepositoryPort } from '../ports/affiliate-code.repository.port';

interface CreateCodeParams {
  userId: string;
  code: string;
  campaignName?: string;
  description?: string;
}

@Injectable()
export class CreateCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly policy: AffiliateCodePolicy,
  ) {}

  async execute({ userId, code, campaignName, description }: CreateCodeParams): Promise<AffiliateCode> {
    const existingCodes = await this.repository.findByUserId(userId);
    this.policy.canCreateCode(existingCodes.length);
    const affiliateCode = AffiliateCode.create({ userId, code, campaignName, description });
    return await this.repository.create(affiliateCode);
  }
}
```

### 3. Ports (포트 레이어)

**역할**: 애플리케이션이 외부에 의존하는 인터페이스를 정의합니다.

**경량 헥사고날 원칙**:
- ✅ **Inbound Port 생략**: Application Service를 직접 사용 (과도한 추상화 지양)
- ✅ **Outbound Port 필수**: 의존성 역전 원칙을 위해 반드시 필요

**Outbound Ports 규칙**:
- ✅ 애플리케이션이 외부에 의존하는 인터페이스 (Repository 등)
- ✅ 포트는 인터페이스만 정의, 구현은 Infrastructure 레이어에서
- ✅ 포트 파일명은 `*.port.ts` 형식
- ✅ Outbound Port는 Token 파일과 함께 제공 (DI용)
- ✅ **Outbound Port 토큰은 `[ENTITY_NAME]_REPOSITORY` 형식을 사용하며, 반드시 Symbol을 사용하여 고유성을 보장한다**
- ✅ **Repository Port 메서드 네이밍은 Repository 네이밍 규칙을 따른다** (참고: Infrastructure 레이어의 Repository 네이밍 규칙)

**예시**:
```typescript
// ports/repository.port.ts
export interface AffiliateCodeRepositoryPort {
  findByUid(uid: string): Promise<AffiliateCode | null>;  // find*: Nullable (기본)
  getByUid(uid: string): Promise<AffiliateCode>;           // get*: 예외 발생 (기본)
  findById(id: bigint): Promise<AffiliateCode | null>;     // find*: Nullable (어드민 전용)
  getById(id: bigint): Promise<AffiliateCode>;             // get*: 예외 발생 (어드민 전용)
  existsByCode(code: string): Promise<boolean>;             // exists*: boolean
  countByUserId(userId: string): Promise<number>;           // count*: 개수
  listByUserId(userId: string, options?: ListOptions): Promise<AffiliateCode[]>; // list*: 목록
  create(code: AffiliateCode): Promise<AffiliateCode>;
  delete(uid: string, userId: string): Promise<void>;
}

// ports/repository.token.ts
export const AFFILIATE_CODE_REPOSITORY = Symbol('AFFILIATE_CODE_REPOSITORY');
```

### 4. Infrastructure (인프라 레이어)

**역할**: Outbound Ports의 구현체입니다. 외부 시스템과의 통신을 담당합니다.

**규칙**:
- ✅ Outbound Port를 구현
- ✅ **Prisma 사용 시 CLS(Context Local Storage)의 `@InjectTransaction()` 데코레이터 사용 필수**
- ✅ PrismaService를 직접 주입받지 않고, `@InjectTransaction()`을 통해 Prisma 클라이언트 접근
- ✅ 트랜잭션 관리는 `@Transactional()` 데코레이터와 `@InjectTransaction()`으로 처리
- ✅ HTTP 클라이언트, 외부 API 등 사용 가능
- ✅ Domain ↔ Infrastructure 변환은 Mapper에서 처리
- ✅ 도메인 엔티티를 직접 반환 (Prisma 모델이 아닌)

**Prisma 사용 규칙**:
- ❌ `PrismaService`를 직접 주입받아 사용하지 않음
- ✅ `@InjectTransaction()` 데코레이터로 `Transaction<TransactionalAdapterPrisma>`를 주입받아 사용
- ✅ `tx` 객체를 통해 Prisma 클라이언트 직접 접근
- ✅ 트랜잭션이 필요한 경우 `@Transactional()` 데코레이터 사용

**Mapper 규칙**:
- ✅ Mapper는 Infrastructure 레이어에 위치
- ✅ **Mapper는 `@Injectable()`을 사용하여 클래스로 정의하고, Repository의 생성자에서 주입받아 사용한다**
- ✅ **Mapper는 오직 Infrastructure 레이어의 구체적인 구현(Prisma Model 등)을 Domain Entity로 변환하는 역할만 하며, 도메인 엔티티 내부에 매퍼 로직이 포함되어서는 안 된다**
- ✅ Domain → Infrastructure 의존 금지 (Domain이 Infrastructure를 알면 안 됨)
- ✅ Infrastructure → Domain 의존만 허용 (Infrastructure가 Domain을 참조하여 변환)
- ✅ Prisma 모델 → Domain 엔티티 변환 (`toDomain`)
- ✅ Domain 엔티티 → Prisma 모델 변환 (`toPrisma`)

**Repository 네이밍 규칙**:
- ✅ **`find*`**: Nullable 반환 (`null` | `[]`). 데이터가 없을 수 있는 상황에 사용
  - 예: `findById()`, `findByUserId()` → `AffiliateCode | null` 또는 `AffiliateCode[]`
- ✅ **`get*`**: 반드시 존재해야 함. 없을 경우 즉시 `DomainException` 발생
  - 예: `getById()`, `getByCode()` → `AffiliateCode` (없으면 예외)
- ✅ **`exists*`**: 존재 여부만 `boolean`으로 반환
  - 예: `existsByCode()`, `existsById()` → `boolean`
- ✅ **`count*`**: 개수 조회
  - 예: `countByUserId()` → `number`
- ✅ **`list*`**: 검색, 정렬, 페이지네이션이 포함된 목록 조회
  - 예: `listByUserId()`, `listWithPagination()` → `AffiliateCode[]`

**Repository 구현 규칙**:
- ✅ **`get*` 메서드는 내부적으로 `find*`를 호출하고 예외 처리를 수행한다**
- ✅ **모든 반환값은 Mapper를 통해 반드시 도메인 엔티티로 변환한다**
- ✅ Prisma 모델을 직접 반환하지 않고 항상 `toDomain()`을 통해 변환
- ✅ **Infrastructure 레이어에서 던져진 `DomainException`은 글로벌 예외 필터에서 HTTP 상태 코드로 변환된다**

**예시**:
```typescript
// infrastructure/affiliate-code.mapper.ts
@Injectable()
export class AffiliateCodeMapper {
  toDomain(prismaModel: any): AffiliateCode {
    // Prisma 모델 → Domain 엔티티 변환
  }

  toPrisma(domain: AffiliateCode): any {
    // Domain 엔티티 → Prisma 모델 변환
  }
}

// infrastructure/repository.ts
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class AffiliateCodeRepository implements AffiliateCodeRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: AffiliateCodeMapper,
  ) {}

  async create(code: AffiliateCode): Promise<AffiliateCode> {
    const data = this.mapper.toPrisma(code);
    const result = await this.tx.affiliateCode.create({ data });
    return this.mapper.toDomain(result);
  }

  // find*: Nullable 반환 (기본: uid 사용)
  async findByUid(uid: string): Promise<AffiliateCode | null> {
    const result = await this.tx.affiliateCode.findUnique({ where: { uid } });
    return result ? this.mapper.toDomain(result) : null;
  }

  // get*: find*를 호출하고 예외 처리 (기본: uid 사용)
  async getByUid(uid: string): Promise<AffiliateCode> {
    const code = await this.findByUid(uid);
    if (!code) throw new AffiliateCodeNotFoundException(uid);
    return code;
  }

  // find*: Nullable 반환 (어드민 전용: id 사용)
  async findById(id: bigint): Promise<AffiliateCode | null> {
    const result = await this.tx.affiliateCode.findUnique({ where: { id } });
    return result ? this.mapper.toDomain(result) : null;
  }

  // get*: find*를 호출하고 예외 처리 (어드민 전용: id 사용)
  async getById(id: bigint): Promise<AffiliateCode> {
    const code = await this.findById(id);
    if (!code) throw new AffiliateCodeNotFoundException(id);
    return code;
  }

  // exists*, count*, list* 등도 동일한 패턴으로 구현
}
```

**트랜잭션 예시**:
```typescript
// application/set-code-as-default.service.ts
@Injectable()
export class SetCodeAsDefaultService {
  @Transactional() // 트랜잭션 시작
  async execute(uid: string, userId: string): Promise<AffiliateCode> {
    const code = await this.repository.getByUid(uid);
    // 여러 Repository 호출이 하나의 트랜잭션으로 묶임
    return code;
  }
}
```

### 5. Controllers (컨트롤러 레이어)

**역할**: HTTP 요청을 처리하는 Inbound Adapter입니다.

**구조**:
- ✅ **유저 컨트롤러와 어드민 컨트롤러가 모두 있는 경우**: `controllers/user/`와 `controllers/admin/` 디렉토리로 분리
- ✅ **단일 컨트롤러만 있는 경우**: `controllers/` 바로 아래에 배치 가능
- ✅ 각 컨트롤러 디렉토리는 독립적인 `dto/request/`와 `dto/response/` 구조를 가짐

**규칙**:
- ✅ Application Service를 직접 주입받아 사용
- ✅ HTTP 관련 로직만 처리 (인증, 검증, 응답 변환)
- ✅ 비즈니스 로직은 Application Service에 위임
- ✅ DTO는 `request/`와 `response/`로 분리
- ✅ **유저 컨트롤러**: 일반 사용자용 API, `uid` 기반 식별자 사용
- ✅ **어드민 컨트롤러**: 운영자용 API, `id`와 `uid` 모두 사용 가능
- ✅ **도메인 예외(`DomainException`)는 글로벌 예외 필터에서 HTTP 상태 코드(404, 400 등)로 변환하여 처리한다**
- ✅ **도메인 예외의 메시지는 항상 영어로 작성되며, 유저에게 그대로 전달된다**

**예시**:
```typescript
// controllers/user/affiliate-code-user.controller.ts
@Controller('user/affiliate-codes')
export class AffiliateCodeUserController {
  constructor(
    private readonly createCodeService: CreateCodeService,
    private readonly findCodesService: FindCodesService,
  ) {}

  @Post()
  async create(@Body() dto: CreateCodeRequestDto): Promise<AffiliateCodeResponseDto> {
    const code = await this.createCodeService.execute(dto);
    return this.toResponseDto(code);
  }

  @Get()
  async list(@Query() dto: FindCodesRequestDto): Promise<AffiliateCodeListResponseDto> {
    const codes = await this.findCodesService.execute(dto);
    return codes.map(code => this.toResponseDto(code));
  }
}

// controllers/admin/affiliate-code-admin.controller.ts
@Controller('admin/affiliate-codes')
export class AffiliateCodeAdminController {
  constructor(
    private readonly findCodeByIdService: FindCodeByIdService,
    private readonly updateCodeService: UpdateCodeService,
  ) {}

  @Get(':id')
  async findById(@Param('id') id: string): Promise<AffiliateCodeAdminResponseDto> {
    const code = await this.findCodeByIdService.execute({ id: BigInt(id) });
    return this.toAdminResponseDto(code); // id와 uid 모두 포함
  }
}
```

### 6. Schedulers (스케줄러 레이어)

**역할**: 시간 기반 작업을 처리하는 Inbound Adapter입니다. Controllers와 동일하게 Use Case Service를 호출합니다.

**규칙**:
- ✅ Use Case Service를 직접 주입받아 사용
- ✅ 스케줄링 관련 로직만 처리 (Cron 설정, 락 관리, 활성화/비활성화)
- ✅ 비즈니스 로직은 Use Case Service에 위임
- ✅ 다중 인스턴스 환경에서는 글로벌 락 사용 필수
- ✅ 에러 발생 시 로깅하고 다음 실행까지 대기
- ✅ 스케줄러 활성화/비활성화는 환경 변수로 제어

**주의사항**:
- ❌ 스케줄러에서 직접 PrismaService나 Repository 구현체 사용 금지
- ❌ 스케줄러에서 비즈니스 로직 구현 금지
- ✅ Use Case Service를 통해 비즈니스 로직 실행

**예시**:
```typescript
// schedulers/update-exchange-rates.scheduler.ts
@Injectable()
export class UpdateExchangeRatesScheduler {
  constructor(
    private readonly updateExchangeRatesService: UpdateExchangeRatesService,
    private readonly envService: EnvService,
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async updateExchangeRates() {
    if (!this.envService.scheduler.enabled) return;
    const lock = await this.concurrencyService.acquireGlobalLock('update-exchange-rates-scheduler', { ttl: 300, retryCount: 0 });
    if (!lock) return;
    try {
      await this.updateExchangeRatesService.execute();
    } finally {
      await lock.release();
    }
  }
}
```

## 의존성 방향 규칙

```
Controllers → Application Service (Use Cases)
Schedulers  → Application Service (Use Cases)
                      ↓
              Domain (순수 비즈니스 로직)
                      ↓
Infrastructure → Outbound Ports (인터페이스)
```

**핵심 원칙**:
1. **Domain은 의존 없음**: 가장 안쪽 레이어, 외부에 의존하지 않음
2. **Application은 Domain과 Outbound Ports에만 의존**: 구현체가 아닌 인터페이스에 의존
3. **Infrastructure는 Outbound Ports 구현**: Application이 정의한 인터페이스 구현
4. **Controllers와 Schedulers는 Application Service에 직접 의존**: 경량 헥사고날에서는 Inbound Port 생략

## NestJS 모듈 설정

**규칙**:
- ✅ **PrismaModule은 Global 모듈이므로 별도 import 불필요** (자동으로 사용 가능)
- ✅ **PrismaModule은 ClsModule을 포함하므로 TransactionHost 사용 가능**
- ✅ **ScheduleModule은 AppModule에서 전역으로 등록** (스케줄러 사용 가능)
- ✅ Outbound Port는 Provider로 등록 (Token 사용)
- ✅ Use Case Services는 Provider로 등록
- ✅ Infrastructure 구현체는 Provider로 등록하고 Token에 바인딩
- ✅ Controllers는 controllers 배열에 등록
- ✅ Schedulers는 providers 배열에 등록 (자동으로 스케줄링 등록)

**예시**:
```typescript
// module-name.module.ts
@Module({
  controllers: [
    ModuleUserController,      // 유저 컨트롤러
    ModuleAdminController,     // 어드민 컨트롤러
  ],
  providers: [
    CreateCodeService,
    UpdateExchangeRatesScheduler,
    {
      provide: REPOSITORY_TOKEN,
      useClass: ModuleRepository,
    },
  ],
  exports: [CreateCodeService],
})
export class ModuleNameModule {}
```

**주의사항**:
- PrismaModule은 `@Global()` 데코레이터로 등록되어 있어 모든 모듈에서 자동으로 사용 가능
- PrismaModule은 내부적으로 ClsModule과 TransactionHost를 설정하므로 별도 설정 불필요
- Infrastructure 레이어에서 `@InjectTransaction()` 데코레이터로 `Transaction<TransactionalAdapterPrisma>`를 주입받아 사용

## 테스트 전략

**NestJS 표준 테스트 파일 위치**:
- ✅ **단위 테스트**: 소스 파일과 같은 디렉토리 (`*.spec.ts`)
  - 예: `create-code.service.ts` → `create-code.service.spec.ts`
- ✅ **통합 테스트**: `test/integration/module-name/` (`*.integration.spec.ts`)
- ✅ **E2E 테스트**: 루트의 `test/` 폴더 (`*.e2e-spec.ts`)

**레이어별 테스트 유형**:
- ✅ Domain, Application, Schedulers: 단위 테스트
- ✅ Infrastructure: 통합 테스트
- ✅ Controllers: E2E 또는 단위 테스트

## 파일 명명 규칙

- **도메인 엔티티**: `kebab-case.entity.ts` (예: `affiliate-code.entity.ts`)
- **값 객체**: `kebab-case-value.ts` (예: `affiliate-code-value.ts`)
- **정책**: `kebab-case-policy.ts` (예: `affiliate-code-policy.ts`)
- **예외**: `kebab-case.exception.ts` (예: `affiliate-code.exception.ts`)
- **Use Case Service**: `kebab-case.service.ts` (예: `create-code.service.ts`, `find-codes.service.ts`, `toggle-code-active.service.ts`)
- **포트**: `kebab-case.port.ts` (예: `affiliate-code.repository.port.ts`)
- **Repository**: `kebab-case.repository.ts` (예: `affiliate-code.repository.ts`)
- **컨트롤러**: `kebab-case.controller.ts` (예: `affiliate-code-user.controller.ts`, `affiliate-code-admin.controller.ts`)
- **스케줄러**: `kebab-case.scheduler.ts` (예: `update-exchange-rates.scheduler.ts`)
- **테스트 파일**: `kebab-case.spec.ts` (단위), `kebab-case.integration.spec.ts` (통합), `kebab-case.e2e-spec.ts` (E2E)

## 경량 헥사고날의 핵심 원칙

1. **과도한 추상화 지양**: Inbound Port 생략, Use Case별 서비스 직접 사용
2. **단일 책임 원칙**: 각 Use Case는 별도의 서비스 클래스로 분리
3. **포트와 어댑터 개념 유지**: Outbound Port는 필수 (의존성 역전 원칙)
4. **실용성 우선**: NestJS와 잘 맞는 구조
5. **테스트 용이성**: Outbound Port 인터페이스로 Mock 가능, Use Case별 독립 테스트
6. **명확한 책임 분리**: 각 레이어와 Use Case의 역할이 분명

## 금지 사항

- ❌ Domain에서 Prisma, HTTP 클라이언트 등 외부 라이브러리 직접 사용 (단, `Prisma.Decimal`과 `Prisma enum` 타입은 예외)
- ❌ **Prisma.Decimal 연산 시 `+`, `-`, `*`, `/` 연산자 사용** (`.add()`, `.sub()`, `.mul()`, `.div()` 메서드 사용 필수)
- ❌ **Infrastructure에서 PrismaService 직접 주입 및 사용** (`@InjectTransaction()` 사용 필수)
- ❌ Application Service에서 Infrastructure 구현체 직접 의존
- ❌ Controllers에서 비즈니스 로직 구현
- ❌ **Schedulers에서 비즈니스 로직 구현** (Use Case Service에 위임)
- ❌ **Schedulers에서 PrismaService나 Repository 구현체 직접 사용** (Use Case Service를 통해 접근)
- ❌ Infrastructure에서 Domain 규칙 위반
- ❌ 포트 인터페이스에 구현 코드 포함
- ❌ **Domain에서 Infrastructure 의존** (Mapper는 Infrastructure에 위치, Domain이 Infrastructure를 알면 안 됨)
- ❌ **도메인 예외 메시지를 한글로 작성** (항상 영어로 작성해야 함)

이 규칙을 준수하여 코드의 일관성, 테스트 용이성, 유지보수성을 유지하세요.

