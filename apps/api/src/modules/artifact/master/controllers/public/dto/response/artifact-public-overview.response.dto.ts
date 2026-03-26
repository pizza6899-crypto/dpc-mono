import { ApiProperty } from '@nestjs/swagger';
import { ArtifactCatalogPublicSummaryResponseDto } from './artifact-catalog-public-summary.response.dto';
import { ArtifactDrawConfigPublicResponseDto } from './artifact-draw-config-public.response.dto';
import { ArtifactPolicyPublicResponseDto } from './artifact-policy-public.response.dto';

/**
 * [Artifact Public] 유물 시스템 개요 통합 응답 DTO
 */
export class ArtifactPublicOverviewResponseDto {
  @ApiProperty({
    description: 'Active Artifact Catalogs / 활성화된 유물 도감 목록',
    type: [ArtifactCatalogPublicSummaryResponseDto],
  })
  catalogs: ArtifactCatalogPublicSummaryResponseDto[];

  @ApiProperty({
    description: 'Artifact Game Policies / 유물 게임 정책 (뽑기 비용, 합성 등)',
    type: ArtifactPolicyPublicResponseDto,
  })
  policy: ArtifactPolicyPublicResponseDto;

  @ApiProperty({
    description: 'Artifact Draw Probabilities / 유물 등급별 뽑기 확률',
    type: [ArtifactDrawConfigPublicResponseDto],
  })
  drawConfigs: ArtifactDrawConfigPublicResponseDto[];
}
