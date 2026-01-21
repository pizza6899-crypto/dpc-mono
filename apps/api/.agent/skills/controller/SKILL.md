---
name: controller_skill
description: NestJS Controller Implementation Guide & Best Practices
---

# Controller Implementation Guide

## 🎯 Overview
이 가이드는 프로젝트의 일관된 컨트롤러 구현을 위한 표준 지침입니다. 모든 새로운 컨트롤러 작성 시 이 가이드를 엄격히 준수해야 합니다.

## 📁 File Structure & Naming
- **User Controller:** `modules/**/controllers/user/{entity-name}.controller.ts`
- **Admin Controller:** `modules/**/controllers/admin/{entity-name}-admin.controller.ts`
- **Request DTOs:** `modules/**/controllers/{type}/dto/request/*.dto.ts`
- **Response DTOs:** `modules/**/controllers/{type}/dto/response/*.dto.ts`

## ✅ Mandatory Rules (Checklist)

### 1. Decorators & Metadata
- **@ApiTags**: **영어만 사용**해야 합니다. 한글을 절대 포함하지 마십시오. (e.g., `@ApiTags('Exchange Rate')`)
- **@ApiOperation**: `summary`에는 영어와 한글 설명을 슬래시(`/`)로 구분하여 병기합니다.
  - 예: `summary: 'Create code / 코드 생성'`
- **@AuditLog**: 상태 변경(Create, Update, Delete)이나 중요 액션(Login)에는 **반드시** AuditLog를 적용해야 합니다.
  - `extractMetadata`를 통해 변경된 대상의 ID나 주요 정보를 남깁니다.
- **@RequireRoles**: 관리자용(`admin`) 컨트롤러에는 필수입니다.
  - 예: `@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)`

### 2. DTO & Validation
- 모든 요청 데이터(`@Body`, `@Query`)는 전용 DTO 클래스로 정의되어야 합니다.
- **Entity 직접 반환 금지**: 반드시 Response DTO로 변환하여 반환해야 합니다.
- 내부적으로 `toResponse` 또는 `toResponseDto` private 메서드를 구현하여 변환 로직을 캡슐화하십시오.

### 3. ID Obfuscation (Sqids)
- **User Controller**: 외부에 노출되는 ID는 **반드시** Sqids로 인코딩되어야 합니다.
  - **Response**: `this.sqidsService.encode(id, SqidsPrefix.PREFIX)`
  - **Request (Param)**: `this.sqidsService.decode(id, SqidsPrefix.PREFIX)`
- **Admin Controller**: 내부 운영 목적이므로 **Raw ID (BigInt/Long)** 그대로 사용하는 것이 기본 원칙입니다.
  - 다만, 클라이언트 요구사항이나 특정 보안 정책에 따라 인코딩이 필요할 수도 있습니다.
  - 별도 요청이 없다면 Response/Request 모두 원래 값을 사용합니다.

### 4. Pagination
- **List Queries**: 목록을 반환하는 모든 GET 요청에는 **반드시** `@Paginated()` 데코레이터를 적용해야 합니다.
- **Swagger**: `@ApiPaginatedResponse(ResponseDto)`를 사용하여 Swagger 문서에 페이지네이션 응답 형식을 명시합니다.
- **Response**: `PaginatedData<T>` 형식을 사용하여 데이터와 페이지네이션 정보를 함께 반환하십시오.

## 💻 Template Code

### Admin Controller Template
```typescript
@Controller('admin/items')
@ApiTags('Admin Items') // ❌ No Korean
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN) // ✅ Role Check
@ApiStandardErrors()
export class ItemAdminController {
  constructor(
    private readonly service: ItemService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({ // ✅ Audit Log Required
    type: LogType.ACTIVITY,
    category: 'ITEM',
    action: 'ITEM_CREATE',
    extractMetadata: (_, __, result) => ({ itemId: result.id }),
  })
  @ApiOperation({ summary: 'Create Item / 아이템 생성' })
  @ApiStandardResponse(ItemResponseDto, { status: 201 })
  async create(@Body() dto: CreateItemDto): Promise<ItemResponseDto> {
    const item = await this.service.create(dto);
    return this.toResponse(item);
  }

  @Patch(':id')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ITEM',
    action: 'ITEM_UPDATE',
    extractMetadata: (_, args, result) => ({ itemId: result.id }),
  })
  @ApiOperation({ summary: 'Update Item / 아이템 수정' })
  @ApiStandardResponse(ItemResponseDto)
  async update(
    @Param('id') id: string, // Admin uses Raw ID
    @Body() dto: UpdateItemDto
  ): Promise<ItemResponseDto> {
    const item = await this.service.update(BigInt(id), dto);
    return this.toResponse(item);
  }

  private toResponse(entity: ItemEntity): ItemResponseDto {
    return {
      id: entity.id.toString(), // Admin returns Raw ID (as string)
      name: entity.name,
      // ... map other fields
    };
  }
}
```

### User Controller Template
```typescript
@Controller('items')
@ApiTags('Items')
@ApiStandardErrors()
export class ItemController {
  constructor(private readonly service: ItemService) {}

  @Get()
  @Paginated() // ✅ Pagination Decorator (Required for list)
  @ApiOperation({ summary: 'List Items / 아이템 목록 조회' })
  @ApiPaginatedResponse(ItemResponseDto)
  async list(
    @Query() query: GetItemsQueryDto
  ): Promise<PaginatedData<ItemResponseDto>> {
    const result = await this.service.findAll(query);
    return {
      data: result.items.map(this.toResponse),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }
}
```
