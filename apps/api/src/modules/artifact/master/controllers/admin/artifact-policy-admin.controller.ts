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

@ApiTags('Admin Artifact Policy')
@Controller('admin/artifact/policy')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ArtifactPolicyAdminController {
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
    // Mock 데이터 응답
    return {
      drawPrices: {
        SINGLE: { USDT: 100 },
        TEN: { USDT: 900 },
      },
      synthesisConfigs: {
        COMMON: { requiredCount: 3, successRate: 0.8 },
        UNCOMMON: { requiredCount: 3, successRate: 0.6, guaranteedCount: 10 },
      },
      slotUnlockConfigs: {
        unlockLevels: [1, 1, 10, 50],
      },
      updatedAt: new Date(),
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
    // TODO: implement service
    return this.getPolicy();
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
