import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { ArtifactPolicyAdminResponseDto } from './dto/response/artifact-policy-admin.response.dto';
import { UpdateArtifactDrawPricesAdminRequestDto } from './dto/request/update-artifact-draw-prices-admin.request.dto';
import { UpdateArtifactSynthesisConfigsAdminRequestDto } from './dto/request/update-artifact-synthesis-configs-admin.request.dto';
import { GetArtifactPolicyAdminService } from '../../application/get-artifact-policy-admin.service';
import { UpdateArtifactDrawPricesAdminService } from '../../application/update-artifact-draw-prices-admin.service';

@ApiTags('Admin Artifact Configurations')
@Controller('admin/artifact/policy')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ArtifactPolicyAdminController {
  constructor(
    private readonly getPolicyService: GetArtifactPolicyAdminService,
    private readonly updateDrawPricesService: UpdateArtifactDrawPricesAdminService,
  ) { }
  /**
   * [GET] 유물 정책 조회
   * Retrieves global artifact policies (draw prices, synthesis configs, etc.).
   */
  @Get()
  @ApiOperation({
    summary: 'Get Artifact Policy / 유물 정책 조회',
    description: 'Retrieves global artifact policies (draw prices, synthesis configs, etc.). / 유물 뽑기 비용 및 합성 확률 등 유물 정책 정보를 조회합니다.',
  })
  @ApiStandardResponse(ArtifactPolicyAdminResponseDto)
  async getPolicy(): Promise<ArtifactPolicyAdminResponseDto> {
    const policy = await this.getPolicyService.execute();

    return {
      drawPrices: policy.drawPrices,
      synthesisConfigs: policy.synthesisConfigs,
      slotUnlockConfigs: policy.slotUnlockConfigs,
      updatedAt: policy.updatedAt,
    };
  }

  /**
   * [PATCH] 유물 뽑기 비용 수정
   * Updates artifact draw prices.
   */
  @Patch('draw-prices')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'UPDATE_POLICY_DRAW_PRICES',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Update Draw Prices / 유물 뽑기 비용 수정',
    description: 'Updates artifact draw prices settings. / 유물 뽑기 비용 설정을 수정합니다.',
  })
  @ApiStandardResponse(ArtifactPolicyAdminResponseDto)
  async updateDrawPrices(
    @Body() dto: UpdateArtifactDrawPricesAdminRequestDto,
  ): Promise<ArtifactPolicyAdminResponseDto> {
    const policy = await this.updateDrawPricesService.execute(dto);

    return {
      drawPrices: policy.drawPrices,
      synthesisConfigs: policy.synthesisConfigs,
      slotUnlockConfigs: policy.slotUnlockConfigs,
      updatedAt: policy.updatedAt,
    };
  }

  /**
   * [PATCH] 유물 합성 설정 수정
   * Updates artifact synthesis configurations.
   */
  @Patch('synthesis-configs')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'UPDATE_POLICY_SYNTHESIS_CONFIGS',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Update Synthesis Configs / 유물 합성 설정 수정',
    description: 'Updates artifact synthesis configurations (pity, success rate, etc.). / 유물을 합성할 때 필요한 소모량 및 확률(Pity 포함) 정보를 수정합니다.',
  })
  @ApiStandardResponse(ArtifactPolicyAdminResponseDto)
  async updateSynthesisConfigs(
    @Body() dto: UpdateArtifactSynthesisConfigsAdminRequestDto,
  ): Promise<ArtifactPolicyAdminResponseDto> {
    // TODO: implement service
    return this.getPolicy();
  }
}
