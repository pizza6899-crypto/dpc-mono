---
module: artifact
version: 1.0
lastUpdated: 2026-04-02
owner: TBD
---

# Artifact Module — Response DTOs

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
