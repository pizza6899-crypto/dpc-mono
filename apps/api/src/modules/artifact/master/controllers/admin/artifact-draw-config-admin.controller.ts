import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { ArtifactDrawConfigAdminResponseDto } from './dto/response/artifact-draw-config-admin.response.dto';
import { UpdateDrawConfigsAdminRequestDto } from './dto/request/update-draw-configs-admin.request.dto';
import { GetDrawConfigAdminService } from '../../application/get-draw-config-admin.service';
import { UpdateDrawConfigsAdminService } from '../../application/update-draw-configs-admin.service';

@ApiTags('Admin Artifact Configurations')
@Controller('admin/artifact/draw-configs')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ArtifactDrawConfigAdminController {
  constructor(
    private readonly getService: GetDrawConfigAdminService,
    private readonly updateService: UpdateDrawConfigsAdminService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get all Draw Configurations / 모든 유물 뽑기 확률 조회',
    description: 'Retrieves artifact draw probabilities for all grades. / 모든 등급의 유물 뽑기는 확률 설정을 조회합니다.',
  })
  @ApiStandardResponse(ArtifactDrawConfigAdminResponseDto, { isArray: true })
  async getDrawConfigs(): Promise<ArtifactDrawConfigAdminResponseDto[]> {
    const list = await this.getService.execute();

    return list.map((item) => ({
      grade: item.grade,
      probability: item.probability.toNumber(),
      updatedAt: item.updatedAt,
    }));
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
    description: `
      Updates multiple draw probabilities at once. / 등급별 유물 뽑기 확률을 일괄적으로 수정합니다.
      
      [Constraints / 제약사항]
      1. All grades must be included in the request. / 모든 등급의 확률 설정이 배열에 포함되어야 합니다.
      2. The sum of all probabilities must be exactly 1.0. / 모든 확률의 총합은 반드시 1.0(100%)이어야 합니다.
    `,
  })
  @ApiStandardResponse(ArtifactDrawConfigAdminResponseDto, { isArray: true })
  async updateDrawConfigs(
    @Body() dto: UpdateDrawConfigsAdminRequestDto,
  ): Promise<ArtifactDrawConfigAdminResponseDto[]> {
    const updatedList = await this.updateService.execute(dto);

    return updatedList.map((item) => ({
      grade: item.grade,
      probability: item.probability.toNumber(),
      updatedAt: item.updatedAt,
    }));
  }
}
