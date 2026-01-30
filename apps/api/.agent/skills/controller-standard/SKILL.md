---
name: controller-standard
description: NestJS 컨트롤러 구현 표준 (API 디자인, Sqids 난독화, 감사 로그 및 Swagger 가이드)
---

# 🎮 NestJS Controller Implementation Standard

## Overview
이 가이드는 프로젝트의 일관된 API 디자인을 위한 컨트롤러 구현 표준을 정의합니다. 사용자(User)와 관리자(Admin) API의 엄격한 분리, 보안을 위한 ID 난독화, 그리고 운영을 위한 감사 로그(AuditLog) 적용이 핵심입니다.

## 📁 디렉토리 및 파일 명명 규칙
*   **User Controller**: `modules/**/controllers/user/{name}.controller.ts`
*   **Admin Controller**: `modules/**/controllers/admin/{name}-admin.controller.ts`
*   **DTO 위치**: 해당 컨트롤러 하위의 `dto/request/`, `dto/response/`에 위치.

---

## ✅ 필수 구현 규칙

### 1. 사용자(User) vs 관리자(Admin) vs 공용(Public) API 분리
*   **User API (Authenticated)**: 
    *   경로: `/{resource}` (예: `/wallet/balance`, `/tiers/my`)
    *   **ID 보안**: 외부 노출 ID는 반드시 `SqidsService`를 통해 난독화.
*   **Admin API (Backoffice)**:
    *   경로: `/admin/{resource}` (예: `/admin/users`, `/admin/tiers`)
    *   **ID 정책**: 내부 운영용이므로 **Raw ID (BigInt -> string)** 사용.
    *   **권한**: `@Admin()` 또는 `@RequireRoles()` 데코레이터 필수.
*   **Public API (Unauthenticated)**:
    *   경로: `/public/{resource}` (예: `/public/tiers`, `/public/notices`)

### 2. ID 난독화 (Sqids)
사용자용 API에서 ID를 노출하거나 전달받을 때 필수 적용합니다.
*   **Response**: `this.sqidsService.encode(id, SqidsPrefix.PREFIX)`
*   **Request (Param)**: `this.sqidsService.decode(id, SqidsPrefix.PREFIX)`
*   **중요**: `SqidsPrefix` 상수를 확인하여 도메인에 맞는 접두어를 사용하십시오.

### 3. 감사 로그 (AuditLog)
상태 변경(생성, 수정, 삭제)이 발생하는 모든 엔드포인트에 적용합니다.
*   **Decorator**: `@AuditLog({ type, category, action, extractMetadata })`
*   **Metadata**: `extractMetadata`를 구현하여 변경된 대상의 ID나 주요 정보를 반드시 기록합니다.

### 4. Swagger & API 문서화
*   **@ApiTags**: **관객/범위 접두사 필수 사용**. `Admin`, `Public`, `User` 중 하나로 시작해야 합니다 (예: `@ApiTags('Admin User Tiers')`, `@ApiTags('User Tiers')`).
*   **@ApiOperation**: `summary` 및 `description`은 반드시 **'English / 한글 설명'** 형식을 사용하여 병기 처리합니다. (예: `summary: 'Get Profile / 프로필 조회'`)
*   **응답 표준**: `@ApiStandardResponse()` 및 `@ApiPaginatedResponse()` 사용.

### 5. 페이지네이션 (Pagination)
일관된 목록 조회를 위해 다음 규칙을 준수합니다.

*   **Query DTO**: `src/common/http/types/pagination.types`의 `createPaginationQueryDto`를 상속받아 구현합니다.
*   **Decorator**: 컨트롤러 메서드에 `@Paginated()` 데코레이터를 반드시 부착합니다. (인터셉터 트리거)
*   **Swagger**: `@ApiPaginatedResponse(ResponseItemDto)`를 사용하여 문서화합니다.
*   **Return Type**: 메서드는 `Promise<PaginatedData<ResponseItemDto>>`를 반환해야 합니다.
    *   **구조**: `{ data: T[], total: number, page: number, limit: number }` 형태의 평탄화된 객체를 반환하십시오.
    *   **주의**: `{ data: [...], pagination: {...} }` 형태로 직접 구조를 만들지 마십시오. 인터셉터가 이를 자동으로 변환합니다.

### 6. DTO(Data Transfer Object) 표준
프로젝트의 일관된 데이터 교환을 위해 형식을 엄격히 준수합니다.

#### 6-1. Request DTO (Validation)
*   **Decorator**: `IsString`, `IsNumber`, `IsOptional`, `IsEnum` 등 `class-validator`를 반드시 사용.
*   **Swagger**: 모든 필드에 `@ApiProperty()` 설정.
    *   `description`은 반드시 **'English / 한글 설명'** 형식을 사용하여 병기 처리합니다. (예: `description: 'User Email / 사용자 이메일'`)
    *   필요 시 `example`, `nullable`, `enum` 명시.
*   **Transform**: 중첩된 객체는 `@Type()`과 `ValidateNested()` 사용.

#### 6-2. Response DTO (Serialization)
*   **ID 변환**: `BigInt`는 반드시 `.toString()`을 통해 **string**으로 변환하여 반환.
*   **Decimal 변환**: 금액 필드(`Decimal`)는 `.toString()` 또는 `.toNumber()` (정밀도 필요 시 string 권장)로 변환.
*   **DTO 순수성 유지 (DTO Purity)**: 
    *   Response DTO는 어플리케이션 계층의 **인터페이스(Result 등)를 직접 import 하지 않는 것**을 원칙으로 합니다. (레이어 간 결합도 최소화)
    *   **매핑 방법**: 컨트롤러에서 객체 전개 연산자(`{ ...result }`)를 사용하거나, 별도의 매퍼 클래스/정적 메서드를 사용하여 매핑합니다.
*   **Swagger**: 
    *   `description`은 반드시 **'English / 한글 설명'** 형식을 사용하여 병기 처리합니다.
    *   필수 필드는 `@ApiProperty()`, 선택 필드는 `@ApiProperty({ nullable: true })` 명시.

---

## 💻 구현 템플릿

```typescript
@Controller('wallet')
@ApiTags('User Wallet')
export class WalletController {
  constructor(private readonly sqidsService: SqidsService) {}

  @Get('transactions')
  @Paginated()
  @ApiOperation({ summary: 'Get transaction history / 트랜잭션 이력 조회' })
  @ApiPaginatedResponse(UserWalletTransactionResponseDto)
  async getTransactionHistory(@Query() query: GetHistoryQueryDto): Promise<PaginatedData<UserWalletTransactionResponseDto>> {
    // Service returns PaginatedData<Entity> ({ data, total, page, limit })
    const result = await this.service.execute(query);
    
    return {
      ...result,
      data: result.data.map(tx => ({
        id: this.sqidsService.encode(tx.id, SqidsPrefix.WALLET_TRANSACTION),
        amount: tx.amount.toString(),
        // ...
      })),
    };
  }
}
```
