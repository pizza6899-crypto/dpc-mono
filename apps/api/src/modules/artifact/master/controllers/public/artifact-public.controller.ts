import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArtifactCatalogStatus } from '@prisma/client';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { GetArtifactCatalogAdminService } from '../../application/get-artifact-catalog-admin.service';
import { GetArtifactPolicyAdminService } from '../../application/get-artifact-policy-admin.service';
import { GetDrawConfigAdminService } from '../../application/get-draw-config-admin.service';
import { ArtifactPublicOverviewResponseDto } from './dto/response/artifact-public-overview.response.dto';

/**
 * [Artifact Public] 유물 도감 및 게임 정책 조회용 퍼블릭 컨트롤러
 */
@ApiTags('Public Artifact')
@Controller('public/artifact')
@ApiStandardErrors()
@Public()
export class ArtifactPublicController {
  constructor(
    private readonly catalogService: GetArtifactCatalogAdminService,
    private readonly policyService: GetArtifactPolicyAdminService,
    private readonly drawConfigService: GetDrawConfigAdminService,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * [GET] 유물 시스템 전체 정보 조회
   */
  @Get()
  @ApiOperation({
    summary: 'Get All Artifact System Information / 유물 시스템 전체 정보 조회',
    description: 'Retrieve all catalysts, policies, and probabilities in a single call. / 도감 목록, 정책 및 비용, 뽑기 확률 정보를 통합 조회합니다.'
  })
  @ApiResponse({
    status: 200,
    description: 'Success / 성공',
    type: ArtifactPublicOverviewResponseDto
  })
  async getOverview(): Promise<ArtifactPublicOverviewResponseDto> {
    const [catalogs, policy, drawConfigs] = await Promise.all([
      // 모든 활성화된 유물을 한꺼번에 가져오기 위해 limit을 충분히 크게 설정
      this.catalogService.getCatalogs({
        limit: 1000,
        statuses: [ArtifactCatalogStatus.ACTIVE],
      }),
      this.policyService.execute(),
      this.drawConfigService.execute(),
    ]);

    return {
      catalogs: catalogs.data.map((item) => ({
        id: this.sqidsService.encode(item.id, SqidsPrefix.ARTIFACT_CATALOG),
        code: item.code,
        grade: item.grade,
        imageUrl: item.imageUrl ?? undefined,
        drawWeight: item.drawWeight,
        casinoBenefit: item.statsSummary.casinoBenefit,
        slotBenefit: item.statsSummary.slotBenefit,
        sportsBenefit: item.statsSummary.sportsBenefit,
        minigameBenefit: item.statsSummary.minigameBenefit,
        badBeatBenefit: item.statsSummary.badBeatBenefit,
        criticalBenefit: item.statsSummary.criticalBenefit,
      })),
      policy: {
        drawPrices: policy.drawPrices,
        synthesisConfigs: policy.synthesisConfigs,
        slotUnlockConfigs: policy.slotUnlockConfigs,
      },
      drawConfigs: drawConfigs.map((config) => ({
        grade: config.grade,
        probability: config.probability.toString(),
      })),
    };
  }
}
