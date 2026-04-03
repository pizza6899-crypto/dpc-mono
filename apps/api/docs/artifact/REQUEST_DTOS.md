---
module: artifact
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: api-request-dtos
audience:
  - ai-agent
  - human
docStatus: reference
topics:
  - artifact
  - request-dtos
  - validation
  - query-params
  - pagination
tasks:
  - inspect-request-fields
  - inspect-validation-rules
  - trace-request-dto-usage
relatedDocs:
  - README.md
  - CONTROLLERS.md
  - RESPONSE_DTOS.md
  - ../SWAGGER_RULES.md
trustLevel: medium
owner: artifact-module
reviewResponsibility:
  - review when request DTO fields, validation rules, or pagination defaults change
  - review when controller input contracts move or rename under artifact source roots
  - review when this summary stops being a faithful quick reference of request-side contracts
sourceRoots:
  - ../../src/modules/artifact/draw/controllers/user/dto/request
  - ../../src/modules/artifact/inventory/controllers/user/dto/request
  - ../../src/modules/artifact/master/controllers/admin/dto/request
  - ../../src/modules/artifact/synthesis/controllers/user/dto/request
---

# Artifact Module — Request DTOs

관련 sibling 문서
- [README.md](README.md) — artifact 문서군 전체 범위와 읽는 순서를 먼저 확인할 수 있습니다.
- [CONTROLLERS.md](CONTROLLERS.md) — 각 요청 DTO가 어느 엔드포인트에서 소비되는지 경로 기준으로 추적할 수 있습니다.
- [RESPONSE_DTOS.md](RESPONSE_DTOS.md) — 같은 API의 입력과 출력을 함께 읽어 계약을 한 번에 파악할 수 있습니다.
- [../SWAGGER_RULES.md](../SWAGGER_RULES.md) — 필드 설명, validation, 예시 문서화 기준을 함께 확인할 때 필요합니다.

문서 지위
- `reference` 문서입니다.
- 빠른 요청 계약 요약용 문서이며, 모든 필드를 exhaustive 하게 보장하는 기준 문서는 아닙니다.
- 세부 필드 타입, validation, 기본값, decorator 동작의 최종 사실 확인은 DTO 소스와 canonical 문서를 우선합니다.

## Draw
- `RequestDrawDto` (`apps/api/src/modules/artifact/draw/controllers/user/dto/request/request-draw.dto.ts`)
  - `drawType`: `ArtifactDrawType` — `@IsEnum`, `@ApiProperty`
  - `paymentType`: `ArtifactDrawPaymentType` — `@IsEnum`, `@ApiProperty`
  - `ticketType?`: `ArtifactGrade | 'ALL'` — `@IsOptional`, default `'ALL'`, `@ApiProperty`

## Inventory
- `EquipArtifactRequestDto` (`apps/api/src/modules/artifact/inventory/controllers/user/dto/request/equip-artifact.request.dto.ts`)
  - `userArtifactId`: `string` — `@IsString`, `@IsNotEmpty`, `@ApiProperty`
  - `slotNo`: `number` — `@IsNumber`, `@Min(1)`, `@ApiProperty`

- `GetMyArtifactsQueryDto` (`apps/api/src/modules/artifact/inventory/controllers/user/dto/request/get-my-artifacts.query.dto.ts`)
  - `grades?`: `ArtifactGrade[]` — `@IsArray`, `@IsEnum(each)`, `@ApiPropertyOptional`
  - pagination: inherited (`defaultLimit: 20, maxLimit: 50, defaultSortBy: acquiredAt`)

- `UnequipArtifactRequestDto` (`apps/api/src/modules/artifact/inventory/controllers/user/dto/request/unequip-artifact.request.dto.ts`)
  - `userArtifactId`: `string` — `@IsString`, `@IsNotEmpty`, `@ApiProperty`

## Master Admin
- `CreateArtifactCatalogAdminRequestDto` — 주요 필드: `code`, `grade`, `drawWeight`, `casinoBenefit`, `slotBenefit`, `sportsBenefit`, `minigameBenefit`, `badBeatBenefit`, `criticalBenefit`, `status`, `fileId` (`@Is*` 검증 포함)

- `GetArtifactCatalogAdminQueryDto` — 필터 필드: `code`, `grades[]`, `statuses[]`, `minWeight`, `maxWeight`, `startDate`, `endDate` (pagination 상속)

- `UpdateArtifactCatalogAdminRequestDto` — `PartialType(CreateArtifactCatalogAdminRequestDto)`

- `UpdateArtifactDrawPricesAdminRequestDto` — `drawPrices: Partial<ArtifactDrawPriceTable>` (`@IsObject`, example)

- `UpdateArtifactSynthesisConfigsAdminRequestDto` — `synthesisConfigs: Partial<ArtifactSynthesisConfigTable>` (`@IsObject`, example)

- `UpdateDrawConfigItemAdminRequestDto` — `grade: ArtifactGrade`, `probability: number (0.0 ~ 1.0)`

- `UpdateDrawConfigsAdminRequestDto` — `configs: UpdateDrawConfigItemAdminRequestDto[]` (`@IsArray`, `@ValidateNested`)

## Synthesis
- `SynthesizeArtifactRequestDto` (`apps/api/src/modules/artifact/synthesis/controllers/user/dto/request/synthesize-artifact.request.dto.ts`)
  - `ingredientIds`: `string[]` — `@IsArray`, `@IsString(each)`, `@ArrayMinSize(3)`, `@ArrayMaxSize(3)`, `@ApiProperty` (minItems/maxItems)

---

Notes:
- 모든 DTO는 `@ApiProperty` / `@ApiPropertyOptional`을 명시하도록 권장합니다.
