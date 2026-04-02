# Artifact Module Swagger Draft (moved)

이 초안은 모듈별 문서로 분리되어 아래 경로에 위치합니다:

- `apps/api/docs/artifact/CONTROLLERS.md`
- `apps/api/docs/artifact/REQUEST_DTOS.md`
- `apps/api/docs/artifact/RESPONSE_DTOS.md`

원본 전체 내용은 분리 완료되었습니다. 상세 편집은 위 파일들을 수정하세요.

## 1. 컨트롤러

### 1.1 User Artifact Draw
- 파일: apps/api/src/modules/artifact/draw/controllers/user/user-artifact-draw.controller.ts
- 태그: User Artifact Draw
- 베이스 경로: user/artifact/draw
- 권한: USER

| Method | Path | Request | Response | Swagger Decorators |
|---|---|---|---|---|
| POST | /request | RequestDrawDto | DrawRequestResponseDto | ApiOperation, ApiStandardResponse |
| GET | /unclaimed | - | UnclaimedDrawResponseDto[] | ApiOperation, ApiStandardResponse(isArray) |
| POST | /claim/:requestId | Param(requestId) | DrawResultResponseDto | ApiOperation, ApiStandardResponse |

비고
- Commit-Reveal 흐름 설명이 주석/description에 포함됨.
- AuditLog 적용: request, claim.

### 1.2 User Artifact Inventory
- 파일: apps/api/src/modules/artifact/inventory/controllers/user/user-artifact-inventory.controller.ts
- 태그: User Artifact Inventory
- 베이스 경로: user/artifact
- 권한: USER

| Method | Path | Request | Response | Swagger Decorators |
|---|---|---|---|---|
| GET | /profile | - | UserArtifactProfileResponseDto | ApiOperation, ApiStandardResponse |
| GET | / | GetMyArtifactsQueryDto | PaginatedData<UserArtifactResponseDto> | ApiOperation, Paginated, ApiPaginatedResponse |
| POST | /equip | EquipArtifactRequestDto | UserArtifactResponseDto | ApiOperation, ApiStandardResponse |
| POST | /unequip | UnequipArtifactRequestDto | boolean | ApiOperation, ApiStandardResponse |

비고
- AuditLog 적용: equip, unequip.

### 1.3 Admin Artifact Catalog
- 파일: apps/api/src/modules/artifact/master/controllers/admin/artifact-catalog-admin.controller.ts
- 태그: Admin Artifact Catalog
- 베이스 경로: admin/artifact/catalog
- 권한: ADMIN, SUPER_ADMIN

| Method | Path | Request | Response | Swagger Decorators |
|---|---|---|---|---|
| GET | / | GetArtifactCatalogAdminQueryDto | PaginatedData<ArtifactCatalogAdminSummaryResponseDto> | ApiOperation, ApiPaginatedResponse |
| GET | /:id | Param(id) | ArtifactCatalogAdminDetailResponseDto | ApiOperation, ApiResponse(200,404) |
| POST | / | CreateArtifactCatalogAdminRequestDto | ArtifactCatalogAdminDetailResponseDto | ApiOperation, ApiResponse(201) |
| PATCH | /:id | UpdateArtifactCatalogAdminRequestDto | ArtifactCatalogAdminDetailResponseDto | ApiOperation, ApiResponse(200) |

비고
- Delete import 존재하지만 DELETE 엔드포인트는 현재 없음.

### 1.4 Admin Draw Config
- 파일: apps/api/src/modules/artifact/master/controllers/admin/artifact-draw-config-admin.controller.ts
- 태그: Admin Artifact Configurations
- 베이스 경로: admin/artifact/draw-configs
- 권한: ADMIN, SUPER_ADMIN

| Method | Path | Request | Response | Swagger Decorators |
|---|---|---|---|---|
| GET | / | - | ArtifactDrawConfigAdminResponseDto[] | ApiOperation, ApiStandardResponse(isArray) |
| PATCH | / | UpdateDrawConfigsAdminRequestDto | ArtifactDrawConfigAdminResponseDto[] | ApiOperation, ApiStandardResponse(isArray) |

비고
- 제약사항(전체 등급 포함, 확률 합 1.0)을 ApiOperation description에 명시.

### 1.5 Admin Policy
- 파일: apps/api/src/modules/artifact/master/controllers/admin/artifact-policy-admin.controller.ts
- 태그: Admin Artifact Configurations
- 베이스 경로: admin/artifact/policy
- 권한: ADMIN, SUPER_ADMIN

| Method | Path | Request | Response | Swagger Decorators |
|---|---|---|---|---|
| GET | / | - | ArtifactPolicyAdminResponseDto | ApiOperation, ApiStandardResponse |
| PATCH | /draw-prices | UpdateArtifactDrawPricesAdminRequestDto | ArtifactPolicyAdminResponseDto | ApiOperation, ApiStandardResponse |
| PATCH | /synthesis-configs | UpdateArtifactSynthesisConfigsAdminRequestDto | ArtifactPolicyAdminResponseDto | ApiOperation, ApiStandardResponse |

### 1.6 Public Artifact
- 파일: apps/api/src/modules/artifact/master/controllers/public/artifact-public.controller.ts
- 태그: Public Artifact
- 베이스 경로: public/artifact
- 권한: Public

| Method | Path | Request | Response | Swagger Decorators |
|---|---|---|---|---|
| GET | / | - | ArtifactPublicOverviewResponseDto | ApiOperation, ApiResponse(200) |

### 1.7 User Artifact Synthesis
- 파일: apps/api/src/modules/artifact/synthesis/controllers/user/user-artifact-synthesis.controller.ts
- 태그: User Artifact Synthesis
- 베이스 경로: user/artifact/synthesis
- 권한: USER

| Method | Path | Request | Response | Swagger Decorators |
|---|---|---|---|---|
| POST | / | SynthesizeArtifactRequestDto | SynthesizeArtifactResponseDto | ApiOperation, ApiStandardResponse |

---

## 2. 요청 DTO

### 2.1 Draw
- RequestDrawDto
  - 파일: apps/api/src/modules/artifact/draw/controllers/user/dto/request/request-draw.dto.ts
  - 필드
    - drawType: ArtifactDrawType, IsEnum, ApiProperty
    - paymentType: ArtifactDrawPaymentType, IsEnum, ApiProperty
    - ticketType: ArtifactGrade | 'ALL', IsOptional, ApiProperty(default: ALL)

### 2.2 Inventory
- EquipArtifactRequestDto
  - 파일: apps/api/src/modules/artifact/inventory/controllers/user/dto/request/equip-artifact.request.dto.ts
  - userArtifactId: string, IsString/IsNotEmpty, ApiProperty
  - slotNo: number, IsNumber/Min(1), ApiProperty

- GetMyArtifactsQueryDto
  - 파일: apps/api/src/modules/artifact/inventory/controllers/user/dto/request/get-my-artifacts.query.dto.ts
  - grades?: ArtifactGrade[], IsArray/IsEnum(each)/IsOptional, ApiPropertyOptional
  - pagination 상속(createPaginationQueryDto): defaultLimit 20, maxLimit 50, sortBy acquiredAt(desc)

- UnequipArtifactRequestDto
  - 파일: apps/api/src/modules/artifact/inventory/controllers/user/dto/request/unequip-artifact.request.dto.ts
  - userArtifactId: string, IsString/IsNotEmpty, ApiProperty

### 2.3 Master Admin
- CreateArtifactCatalogAdminRequestDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/request/create-artifact-catalog-admin.request.dto.ts
  - 주요 필드: code, grade, drawWeight, casinoBenefit, slotBenefit, sportsBenefit, minigameBenefit, badBeatBenefit, criticalBenefit, status, fileId
  - 검증: IsString/IsEnum/IsInt/Min/IsOptional

- GetArtifactCatalogAdminQueryDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/request/get-artifact-catalog-admin-query.dto.ts
  - 주요 필드: code, grades[], statuses[], minWeight, maxWeight, startDate, endDate
  - 검증: IsOptional, IsArray, IsEnum(each), IsInt, Min, IsDateString
  - pagination 상속(createPaginationQueryDto): defaultLimit 20, maxLimit 100

- UpdateArtifactCatalogAdminRequestDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/request/update-artifact-catalog-admin.request.dto.ts
  - PartialType(CreateArtifactCatalogAdminRequestDto)

- UpdateArtifactDrawPricesAdminRequestDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/request/update-artifact-draw-prices-admin.request.dto.ts
  - drawPrices: Partial<ArtifactDrawPriceTable>, IsObject/IsNotEmpty, ApiProperty(example)

- UpdateArtifactSynthesisConfigsAdminRequestDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/request/update-artifact-synthesis-configs-admin.request.dto.ts
  - synthesisConfigs: Partial<ArtifactSynthesisConfigTable>, IsObject/IsNotEmpty, ApiProperty(example)

- UpdateDrawConfigItemAdminRequestDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/request/update-draw-config-item-admin.request.dto.ts
  - grade: ArtifactGrade, IsEnum/IsNotEmpty, ApiProperty
  - probability: number, IsNumber/Min(0)/Max(1), ApiProperty

- UpdateDrawConfigsAdminRequestDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/request/update-draw-configs-admin.request.dto.ts
  - configs: UpdateDrawConfigItemAdminRequestDto[], IsArray/ArrayNotEmpty/ValidateNested, ApiProperty(type:[])

### 2.4 Synthesis
- SynthesizeArtifactRequestDto
  - 파일: apps/api/src/modules/artifact/synthesis/controllers/user/dto/request/synthesize-artifact.request.dto.ts
  - ingredientIds: string[], IsArray/IsString(each)/ArrayMinSize(3)/ArrayMaxSize(3), ApiProperty(minItems/maxItems)

---

## 3. 응답 DTO

### 3.1 Draw
- DrawRequestResponseDto
  - 파일: apps/api/src/modules/artifact/draw/controllers/user/dto/response/draw-request.response.dto.ts
  - requestId, targetSlot, createdAt

- DrawResultResponseDto
  - 파일: apps/api/src/modules/artifact/draw/controllers/user/dto/response/draw-result.response.dto.ts
  - requestId, status, items[], settledAt?, claimedAt?
  - nested: DrawnItemDto(userArtifactId, artifactCode, grade, blockhash, roll)

- UnclaimedDrawResponseDto
  - 파일: apps/api/src/modules/artifact/draw/controllers/user/dto/response/unclaimed-draw.response.dto.ts
  - requestId, status, drawType, targetSlot, createdAt, settledAt?

### 3.2 Inventory
- UserArtifactResponseDto
  - 파일: apps/api/src/modules/artifact/inventory/controllers/user/dto/response/user-artifact.response.dto.ts
  - id, artifactCode, slotNo?, isEquipped, grade?, acquiredAt

- UserArtifactProfileResponseDto
  - 파일: apps/api/src/modules/artifact/inventory/controllers/user/dto/response/user-artifact-profile.response.dto.ts
  - activeSlotCount, slots[], effects, tickets
  - nested
    - UserArtifactSlotResponseDto
    - UserArtifactEffectSummaryDto
    - UserArtifactTicketResponseDto

### 3.3 Master Admin
- ArtifactCatalogAdminSummaryResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/response/artifact-catalog-admin-list.response.dto.ts
  - id, code, grade, status, drawWeight, imageUrl?, benefits..., createdAt, updatedAt

- ArtifactCatalogAdminDetailResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/response/artifact-catalog-admin-detail.response.dto.ts
  - Summary DTO 상속

- ArtifactDrawConfigAdminResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/response/artifact-draw-config-admin.response.dto.ts
  - grade, probability, updatedAt

- ArtifactPolicyAdminResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/admin/dto/response/artifact-policy-admin.response.dto.ts
  - drawPrices, synthesisConfigs, slotUnlockConfigs, updatedAt

### 3.4 Master Public
- ArtifactCatalogPublicSummaryResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/public/dto/response/artifact-catalog-public-summary.response.dto.ts
  - id, code, grade, imageUrl?, drawWeight, benefits...

- ArtifactDrawConfigPublicResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/public/dto/response/artifact-draw-config-public.response.dto.ts
  - grade, probability(string)

- ArtifactPolicyPublicResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/public/dto/response/artifact-policy-public.response.dto.ts
  - drawPrices, synthesisConfigs, slotUnlockConfigs

- ArtifactPublicOverviewResponseDto
  - 파일: apps/api/src/modules/artifact/master/controllers/public/dto/response/artifact-public-overview.response.dto.ts
  - catalogs[], policy, drawConfigs[]

### 3.5 Synthesis
- SynthesizeArtifactResponseDto
  - 파일: apps/api/src/modules/artifact/synthesis/controllers/user/dto/response/synthesize-artifact.response.dto.ts
  - isSuccess, reward?, currentPityCount, isGuaranteed?
  - nested: SynthesizeRewardArtifactDto(id, artifactCode, grade, acquiredAt)

---

## 4. 문서화 보완 TODO (초안)

### High
- 보호 API 컨트롤러에 ApiBearerAuth 적용 여부 통일
- 실패 응답 코드(400/401/403/404/409) 엔드포인트별 표준화

### Medium
- Policy 계열 복합 객체(Record/Object) 스키마를 세부 DTO로 분해 검토
- ApiStandardResponse와 ApiResponse 사용 기준 통일

### Low
- 응답 DTO example 보강
- enum 필드 설명(description) 상세화

---

## 5. 다음 편집 포맷 제안

문서를 아래 3개로 분리하면 운영/리뷰가 쉬움
1) CONTROLLERS.md
2) REQUEST_DTOS.md
3) RESPONSE_DTOS.md

현재 파일은 통합 초안이며, 리뷰 후 분할 권장.
