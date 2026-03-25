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
import { GetCharacterConfigService } from '../../application/get-character-config.service';
import { UpdateCharacterConfigService } from '../../application/update-character-config.service';
import { UpdateCharacterConfigAdminRequestDto } from './dto/request/update-character-config-admin.request.dto';
import { CharacterConfigAdminResponseDto } from './dto/response/character-config-admin.response.dto';

@Controller('admin/character/config')
@ApiTags('Admin Character Config')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class CharacterConfigAdminController {
  constructor(
    private readonly getService: GetCharacterConfigService,
    private readonly updateService: UpdateCharacterConfigService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get Character Config / 게이미피케이션 전역 정책 조회',
    description: 'Retrieves global character rules including XP multipliers and stat point policies. / 경험치 배율, 스탯 포인트 지급 정책 등 전역 게이미피케이션 규칙을 조회합니다.',
  })
  @ApiStandardResponse(CharacterConfigAdminResponseDto)
  async getConfig(): Promise<CharacterConfigAdminResponseDto> {
    const config = await this.getService.execute();

    return {
      id: config.id,
      xpGrantMultiplierUsd: config.xpGrantMultiplierUsd.toString(),
      statPointsGrantPerLevel: config.statPointsGrantPerLevel,
      maxStatLimit: config.maxStatLimit,
      statResetPrices: config.statResetPrices,
      updatedAt: config.updatedAt,
    };
  }

  @Patch()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'CHARACTER',
    action: 'UPDATE_CONFIG',
    extractMetadata: (req) => ({
      payload: req.body,
    }),
  })
  @ApiOperation({
    summary: 'Update Character Config / 게이미피케이션 전역 정책 수정',
    description: 'Modifies global character rules. All changes are tracked in activity logs. / 전역 게이미피케이션 규칙을 수정합니다. 모든 변경 내역은 활동 로그에 기록됩니다.',
  })
  @ApiStandardResponse(CharacterConfigAdminResponseDto)
  async updateConfig(
    @Body() dto: UpdateCharacterConfigAdminRequestDto,
  ): Promise<CharacterConfigAdminResponseDto> {
    const config = await this.updateService.execute({
      ...dto,
    });

    return {
      id: config.id,
      xpGrantMultiplierUsd: config.xpGrantMultiplierUsd.toString(),
      statPointsGrantPerLevel: config.statPointsGrantPerLevel,
      maxStatLimit: config.maxStatLimit,
      statResetPrices: config.statResetPrices,
      updatedAt: config.updatedAt,
    };
  }
}
