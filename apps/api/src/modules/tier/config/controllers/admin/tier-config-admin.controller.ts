import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { TierConfigService } from '../../application/tier-config.service';
import { TierConfigAdminResponseDto } from './dto/response/tier-config-admin.response.dto';
import { UpdateTierConfigAdminRequestDto } from './dto/request/update-tier-config-admin.request.dto';
import { TierConfig } from '../../domain/tier-config.entity';

@Controller('admin/tiers/config')
@ApiTags('Admin Tier Config')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class TierConfigAdminController {
  constructor(private readonly tierConfigService: TierConfigService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get global tier configuration / 글로벌 티어 설정 조회',
    description:
      'Retrieves global settings for the tier system, such as whether promotion/downgrade and bonuses are enabled. / 승급/강등 및 보너스 활성화 여부 등 티어 시스템의 전역 설정을 조회합니다.',
  })
  @ApiStandardResponse(TierConfigAdminResponseDto)
  async getConfig(): Promise<TierConfigAdminResponseDto> {
    const config = await this.tierConfigService.find();
    return this.mapToResponseDto(config);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update global tier configuration / 글로벌 티어 설정 수정',
    description:
      'Updates global settings for the tier system. / 티어 시스템의 전역 설정을 수정합니다.',
  })
  @ApiStandardResponse(TierConfigAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_TIER_CONFIG',
    category: 'TIER',
    extractMetadata: (req) => ({
      before: req.__audit_before,
      after: req.__audit_after,
    }),
  })
  async updateConfig(
    @Body() dto: UpdateTierConfigAdminRequestDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ): Promise<TierConfigAdminResponseDto> {
    // Audit log용 이전 상태 기록
    const before = await this.tierConfigService.find();

    const updated = await this.tierConfigService.update({
      ...dto,
      updatedBy: admin.id,
    });

    // Audit log 메타데이터 세팅
    req.__audit_before = before;
    req.__audit_after = updated;

    return this.mapToResponseDto(updated);
  }

  private mapToResponseDto(config: TierConfig): TierConfigAdminResponseDto {
    return {
      isUpgradeEnabled: config.isUpgradeEnabled,
      isDowngradeEnabled: config.isDowngradeEnabled,
      isBonusEnabled: config.isBonusEnabled,
      defaultDowngradeGracePeriodDays: config.defaultDowngradeGracePeriodDays,
      defaultRewardExpiryDays: config.defaultRewardExpiryDays,
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy?.toString() ?? null,
    };
  }
}
