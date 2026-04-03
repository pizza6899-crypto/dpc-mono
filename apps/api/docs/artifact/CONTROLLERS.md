---
module: artifact
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: api-controllers-map
audience:
  - ai-agent
  - human
docStatus: reference
topics:
  - artifact
  - controllers
  - routes
  - auth
  - endpoint-map
tasks:
  - find-endpoint
  - inspect-auth-scope
  - trace-controller-to-dtos
relatedDocs:
  - README.md
  - REQUEST_DTOS.md
  - RESPONSE_DTOS.md
  - ../SWAGGER_RULES.md
trustLevel: medium
owner: artifact-module
reviewResponsibility:
  - review when artifact controller routes, auth scopes, or endpoint groupings change
  - review when controller-to-DTO mapping changes
  - review when this summary no longer matches controller source files under sourceRoots
sourceRoots:
  - ../../src/modules/artifact/draw/controllers
  - ../../src/modules/artifact/inventory/controllers
  - ../../src/modules/artifact/master/controllers
  - ../../src/modules/artifact/synthesis/controllers
---

# Artifact Module — Controllers

요약: `apps/api/src/modules/artifact` 내 컨트롤러들의 엔드포인트·요청·응답 매핑입니다.

관련 sibling 문서
- [README.md](README.md) — artifact 문서군의 시작점으로, 현재 컨트롤러 맵이 전체 문서 구조에서 어디에 놓이는지 먼저 확인할 수 있습니다.
- [REQUEST_DTOS.md](REQUEST_DTOS.md) — 각 엔드포인트가 실제로 어떤 입력 DTO를 받는지 바로 이어서 확인할 수 있습니다.
- [RESPONSE_DTOS.md](RESPONSE_DTOS.md) — 각 엔드포인트가 어떤 응답 DTO를 반환하는지 대응 관계를 확인할 수 있습니다.
- [../SWAGGER_RULES.md](../SWAGGER_RULES.md) — 컨트롤러 데코레이터와 응답 문서화 규칙을 프로젝트 기준과 맞출 때 필요합니다.

문서 지위
- `reference` 문서입니다.
- 빠른 엔드포인트 맵 확인용 요약 문서이며, 세부 데코레이터/파라미터/응답 계약의 최종 사실 확인은 컨트롤러 소스와 canonical 문서를 우선합니다.
- 코드와 충돌하면 코드를 우선하고, 이 문서를 동기화 대상으로 봐야 합니다.

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
