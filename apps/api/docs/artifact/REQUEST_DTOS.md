---
module: artifact
version: 1.0
lastUpdated: 2026-04-02
owner: TBD
---

# Artifact Module — Request DTOs

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
