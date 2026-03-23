import {
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetGamificationConfigService } from '../../application/get-gamification-config.service';
import { UpdateGamificationConfigService } from '../../application/update-gamification-config.service';
import { UpdateGamificationConfigAdminRequestDto } from './dto/request/update-gamification-config-admin.request.dto';
import { GamificationConfigAdminResponseDto } from './dto/response/gamification-config-admin.response.dto';

@Controller('admin/gamification/config')
@ApiTags('Admin Gamification Config')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class GamificationConfigAdminController {
  constructor(
    private readonly getService: GetGamificationConfigService,
    private readonly updateService: UpdateGamificationConfigService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get Gamification Config / 게이미피케이션 전역 정책 조회',
    description: 'Retrieves global gamification rules including XP multipliers and stat point policies. / 경험치 배율, 스탯 포인트 지급 정책 등 전역 게이미피케이션 규칙을 조회합니다.',
  })
  @ApiStandardResponse(GamificationConfigAdminResponseDto)
  async getConfig(): Promise<GamificationConfigAdminResponseDto> {
    const config = await this.getService.execute();

    return {
      id: config.id,
      xpGrantMultiplierUsd: config.xpGrantMultiplierUsd.toString(),
      statPointsGrantPerLevel: config.statPointsGrantPerLevel,
      maxStatLimit: config.maxStatLimit,
      statResetPrice: config.statResetPrice.toString(),
      statResetCurrency: config.statResetCurrency,
      updatedAt: config.updatedAt,
    };
  }

  @Patch()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'GAMIFICATION',
    action: 'UPDATE_CONFIG',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Update Gamification Config / 게이미피케이션 전역 정책 수정',
    description: 'Modifies global gamification rules. All changes are tracked in activity logs. / 전역 게이미피케이션 규칙을 수정합니다. 모든 변경 내역은 활동 로그에 기록됩니다.',
  })
  @ApiStandardResponse(GamificationConfigAdminResponseDto)
  async updateConfig(
    @Body() dto: UpdateGamificationConfigAdminRequestDto,
  ): Promise<GamificationConfigAdminResponseDto> {
    const config = await this.updateService.execute({
      ...dto,
    });

    return {
      id: config.id,
      xpGrantMultiplierUsd: config.xpGrantMultiplierUsd.toString(),
      statPointsGrantPerLevel: config.statPointsGrantPerLevel,
      maxStatLimit: config.maxStatLimit,
      statResetPrice: config.statResetPrice.toString(),
      statResetCurrency: config.statResetCurrency,
      updatedAt: config.updatedAt,
    };
  }
}
