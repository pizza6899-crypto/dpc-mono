---
module: artifact
version: 1.0
lastUpdated: 2026-04-03
lastReviewed: 2026-04-03
docType: api-response-dtos
audience:
  - ai-agent
  - human
docStatus: reference
topics:
  - artifact
  - response-dtos
  - response-shape
  - nested-dtos
  - public-admin-user-responses
tasks:
  - inspect-response-shape
  - find-response-dto
  - trace-response-contract
relatedDocs:
  - README.md
  - CONTROLLERS.md
  - REQUEST_DTOS.md
  - ../SWAGGER_RULES.md
trustLevel: medium
owner: artifact-module
reviewResponsibility:
  - review when response DTO fields, nested shapes, or wrapper contracts change
  - review when controller response mappings change across artifact endpoints
  - review when this summary no longer matches response-side source DTOs under sourceRoots
sourceRoots:
  - ../../src/modules/artifact/draw/controllers/user/dto/response
  - ../../src/modules/artifact/inventory/controllers/user/dto/response
  - ../../src/modules/artifact/master/controllers/admin/dto/response
  - ../../src/modules/artifact/master/controllers/public/dto/response
  - ../../src/modules/artifact/synthesis/controllers/user/dto/response
---

# Artifact Module — Response DTOs

관련 sibling 문서
- [README.md](README.md) — artifact 문서군 전체 맥락과 현재 문서의 위치를 먼저 확인할 수 있습니다.
- [CONTROLLERS.md](CONTROLLERS.md) — 각 응답 DTO가 어느 엔드포인트와 연결되는지 빠르게 역추적할 수 있습니다.
- [REQUEST_DTOS.md](REQUEST_DTOS.md) — 동일한 API의 요청 DTO와 응답 DTO를 짝으로 읽을 때 필요합니다.
- [../SWAGGER_RULES.md](../SWAGGER_RULES.md) — 응답 래퍼, 배열 응답, 예시 표기 규칙을 프로젝트 기준과 맞출 때 필요합니다.

문서 지위
- `reference` 문서입니다.
- 빠른 응답 shape 요약용 문서이며, 세부 nested 필드와 직렬화 계약의 최종 사실 확인은 응답 DTO 소스와 canonical 문서를 우선합니다.
- 줄임표나 요약 표기가 있는 항목은 전체 필드 목록을 완전히 대체하지 않는다고 이해해야 합니다.

## Draw
- `DrawRequestResponseDto` — `requestId`, `targetSlot`, `createdAt`
- `DrawResultResponseDto` — `requestId`, `status`, `items[]`, `settledAt?`, `claimedAt?` (nested `DrawnItemDto`)
- `UnclaimedDrawResponseDto` — `requestId`, `status`, `drawType`, `targetSlot`, `createdAt`, `settledAt?`

## Inventory
- `UserArtifactResponseDto` — `id`, `artifactCode`, `slotNo?`, `isEquipped`, `grade?`, `acquiredAt`
- `UserArtifactProfileResponseDto` — `activeSlotCount`, `slots[]`(UserArtifactSlotResponseDto), `effects`(UserArtifactEffectSummaryDto), `tickets`(UserArtifactTicketResponseDto)

## Master Admin
- `ArtifactCatalogAdminSummaryResponseDto` — `id`, `code`, `grade`, `status`, `drawWeight`, `imageUrl?`, benefits..., `createdAt`, `updatedAt`
- `ArtifactCatalogAdminDetailResponseDto` — Summary 상속
- `ArtifactDrawConfigAdminResponseDto` — `grade`, `probability`, `updatedAt`
- `ArtifactPolicyAdminResponseDto` — `drawPrices`, `synthesisConfigs`, `slotUnlockConfigs`, `updatedAt`

## Master Public
- `ArtifactCatalogPublicSummaryResponseDto` — `id`, `code`, `grade`, `imageUrl?`, `drawWeight`, benefits...
- `ArtifactDrawConfigPublicResponseDto` — `grade`, `probability (string)`
- `ArtifactPolicyPublicResponseDto` — `drawPrices`, `synthesisConfigs`, `slotUnlockConfigs`
- `ArtifactPublicOverviewResponseDto` — `catalogs[]`, `policy`, `drawConfigs[]`

## Synthesis
- `SynthesizeArtifactResponseDto` — `isSuccess`, `reward?`(SynthesizeRewardArtifactDto), `currentPityCount`, `isGuaranteed?`

---

Notes:
- 복합 타입(`drawPrices`, `synthesisConfigs`)은 가능한 경우 별도 DTO로 분리 권장.
