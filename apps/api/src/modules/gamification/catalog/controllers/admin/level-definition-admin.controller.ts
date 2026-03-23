import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetLevelDefinitionListService } from '../../application/get-level-definition-list.service';
import { UpdateLevelDefinitionService } from '../../application/update-level-definition.service';
import { SaveLevelDefinitionAdminRequestDto } from './dto/request/update-level-definition-admin.request.dto';
import { LevelDefinitionAdminResponseDto } from './dto/response/level-definition-admin.response.dto';

@Controller('admin/gamification/levels')
@ApiTags('Admin Gamification Level Definitions')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class LevelDefinitionAdminController {
  constructor(
    private readonly getListService: GetLevelDefinitionListService,
    private readonly updateService: UpdateLevelDefinitionService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get all Level Definitions / 모든 레벨 정의 조회',
    description: 'Retrieves all levels in ascending order. / 오름차순으로 모든 레벨 정의를 조회합니다.',
  })
  @ApiStandardResponse(LevelDefinitionAdminResponseDto, { isArray: true })
  async getLevels(): Promise<LevelDefinitionAdminResponseDto[]> {
    const list = await this.getListService.execute();

    return list.map((l) => ({
      level: l.level,
      requiredXp: l.requiredXp.toString(),
      tierCode: l.tierCode,
      tierImageUrl: l.tierImageUrl,
      statPointsBoost: l.statPointsBoost,
      updatedAt: l.updatedAt,
    }));
  }

  @Post()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'SAVE_LEVEL_DEFINITION',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Create or Update Level Definition / 레벨 정의 생성 및 수정',
    description: 'Stores mastery data for a level. / 특정 레벨의 마스터 데이터를 저장합니다.',
  })
  @ApiStandardResponse(LevelDefinitionAdminResponseDto)
  async saveLevel(
    @Body() dto: SaveLevelDefinitionAdminRequestDto,
  ): Promise<LevelDefinitionAdminResponseDto> {
    const l = await this.updateService.execute({
      ...dto,
    });

    return {
      level: l.level,
      requiredXp: l.requiredXp.toString(),
      tierCode: l.tierCode,
      tierImageUrl: l.tierImageUrl,
      statPointsBoost: l.statPointsBoost,
      updatedAt: l.updatedAt,
    };
  }
}
