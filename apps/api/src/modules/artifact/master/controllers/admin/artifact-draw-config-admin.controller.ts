import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { ArtifactDrawConfigAdminResponseDto } from './dto/response/artifact-draw-config-admin.response.dto';
import { UpdateDrawConfigsAdminRequestDto } from './dto/request/update-draw-configs-admin.request.dto';

@ApiTags('Admin Artifact Draw Configurations')
@Controller('admin/artifact/draw-configs')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ArtifactDrawConfigAdminController {
  constructor(
    // private readonly getService: GetDrawConfigAdminService,
    // private readonly updateService: UpdateDrawConfigAdminService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get all Draw Configurations / 모든 유물 뽑기 확률 조회',
    description: 'Retrieves artifact draw probabilities for all grades. / 모든 등급의 유물 뽑기는 확률 설정을 조회합니다.',
  })
  @ApiStandardResponse(ArtifactDrawConfigAdminResponseDto, { isArray: true })
  async getDrawConfigs(): Promise<ArtifactDrawConfigAdminResponseDto[]> {
    // TODO: 서비스 구현 시 연동 (현재 목업 응답)
    return [];
  }

  @Patch()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ARTIFACT',
    action: 'UPDATE_DRAW_CONFIG',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Update Draw Configurations / 유물 뽑기 확률 일괄 수정',
    description: 'Updates multiple draw probabilities at once. / 등급별 유물 뽑기 확률을 일괄적으로 수정합니다.',
  })
  @ApiStandardResponse(ArtifactDrawConfigAdminResponseDto, { isArray: true })
  async updateDrawConfigs(
    @Body() dto: UpdateDrawConfigsAdminRequestDto,
  ): Promise<ArtifactDrawConfigAdminResponseDto[]> {
    // TODO: 서비스 구현 시 연동 (현재 목업 응답)
    console.log('Update Draw Configs Payload:', dto);
    return [];
  }
}
