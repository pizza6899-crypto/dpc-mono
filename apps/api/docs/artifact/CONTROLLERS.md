---
module: artifact
version: 1.0
lastUpdated: 2026-04-02
owner: TBD
---

# Artifact Module — Controllers

요약: `apps/api/src/modules/artifact` 내 컨트롤러들의 엔드포인트·요청·응답 매핑입니다.

## User Artifact Draw
- 파일: `apps/api/src/modules/artifact/draw/controllers/user/user-artifact-draw.controller.ts`
- 베이스 경로: `/user/artifact/draw`
- 권한: USER

Endpoints:
- POST `/request` — RequestDrawDto -> DrawRequestResponseDto
- GET `/unclaimed` — -> UnclaimedDrawResponseDto[]
- POST `/claim/:requestId` — param(requestId) -> DrawResultResponseDto

Notes: Commit-Reveal 흐름과 AuditLog 적용.

## User Artifact Inventory
- 파일: `apps/api/src/modules/artifact/inventory/controllers/user/user-artifact-inventory.controller.ts`
- 베이스 경로: `/user/artifact`
- 권한: USER

Endpoints:
- GET `/profile` — -> UserArtifactProfileResponseDto
- GET `/` — GetMyArtifactsQueryDto -> PaginatedData<UserArtifactResponseDto]
- POST `/equip` — EquipArtifactRequestDto -> UserArtifactResponseDto
- POST `/unequip` — UnequipArtifactRequestDto -> boolean

## Admin Artifact Catalog
- 파일: `apps/api/src/modules/artifact/master/controllers/admin/artifact-catalog-admin.controller.ts`
- 베이스 경로: `/admin/artifact/catalog`
- 권한: ADMIN, SUPER_ADMIN

Endpoints:
- GET `/` — GetArtifactCatalogAdminQueryDto -> PaginatedData<ArtifactCatalogAdminSummaryResponseDto>
- GET `/:id` — param(id) -> ArtifactCatalogAdminDetailResponseDto
- POST `/` — CreateArtifactCatalogAdminRequestDto -> ArtifactCatalogAdminDetailResponseDto
- PATCH `/:id` — UpdateArtifactCatalogAdminRequestDto -> ArtifactCatalogAdminDetailResponseDto

## Admin Draw Config
- 파일: `apps/api/src/modules/artifact/master/controllers/admin/artifact-draw-config-admin.controller.ts`
- 베이스 경로: `/admin/artifact/draw-configs`

Endpoints:
- GET `/` — -> ArtifactDrawConfigAdminResponseDto[]
- PATCH `/` — UpdateDrawConfigsAdminRequestDto -> ArtifactDrawConfigAdminResponseDto[]

## Admin Policy
- 파일: `apps/api/src/modules/artifact/master/controllers/admin/artifact-policy-admin.controller.ts`
- 베이스 경로: `/admin/artifact/policy`

Endpoints:
- GET `/` — -> ArtifactPolicyAdminResponseDto
- PATCH `/draw-prices` — UpdateArtifactDrawPricesAdminRequestDto -> ArtifactPolicyAdminResponseDto
- PATCH `/synthesis-configs` — UpdateArtifactSynthesisConfigsAdminRequestDto -> ArtifactPolicyAdminResponseDto

## Public Artifact
- 파일: `apps/api/src/modules/artifact/master/controllers/public/artifact-public.controller.ts`
- 베이스 경로: `/public/artifact`
- 권한: Public

Endpoints:
- GET `/` — -> ArtifactPublicOverviewResponseDto

## User Artifact Synthesis
- 파일: `apps/api/src/modules/artifact/synthesis/controllers/user/user-artifact-synthesis.controller.ts`
- 베이스 경로: `/user/artifact/synthesis`
- 권한: USER

Endpoints:
- POST `/` — SynthesizeArtifactRequestDto -> SynthesizeArtifactResponseDto
