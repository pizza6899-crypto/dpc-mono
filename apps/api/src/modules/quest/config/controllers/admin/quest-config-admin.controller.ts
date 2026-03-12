import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { GetQuestConfigService } from '../../application/get-quest-config.service';
import { UpdateQuestConfigService } from '../../application/update-quest-config.service';
import { QuestConfigAdminResponseDto } from './dto/response/quest-config-admin-response.dto';
import { UpdateQuestConfigAdminDto } from './dto/request/update-quest-config-admin.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/quest-config')
@ApiTags('Admin Quest Config')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class QuestConfigAdminController {
  constructor(
    private readonly getQuestConfigService: GetQuestConfigService,
    private readonly updateQuestConfigService: UpdateQuestConfigService,
  ) { }

  /**
   * 전역 퀘스트 설정 조회 (관리자용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Global Quest Config / 전역 퀘스트 설정 조회',
    description: 'Retrieves the system-wide quest status and settings. / 시스템 전역 퀘스트 활성화 상태 및 설정을 조회합니다.',
  })
  @ApiStandardResponse(QuestConfigAdminResponseDto, {
    status: 200,
    description: 'Successfully retrieved quest configuration / 설정 조회 성공',
  })
  async getConfig(): Promise<QuestConfigAdminResponseDto> {
    const config = await this.getQuestConfigService.execute();

    return {
      isSystemEnabled: config.isSystemEnabled,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * 전역 퀘스트 설정 수정 (관리자용)
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Global Quest Config / 전역 퀘스트 설정 수정',
    description: 'Updates the global quest status. / 시스템 전역 퀘스트 활성화 상태를 변경합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'QUEST_CONFIG',
    action: 'UPDATE_CONFIG',
    extractMetadata: (req) => ({ body: req.body }),
  })
  @ApiStandardResponse(QuestConfigAdminResponseDto, {
    status: 200,
    description: 'Successfully updated quest configuration / 설정 수정 성공',
  })
  async updateConfig(
    @Body() dto: UpdateQuestConfigAdminDto,
  ): Promise<QuestConfigAdminResponseDto> {
    const config = await this.updateQuestConfigService.execute(dto);

    return {
      isSystemEnabled: config.isSystemEnabled,
      updatedAt: config.updatedAt,
    };
  }
}
