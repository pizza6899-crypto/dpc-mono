import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { TierSettingsService } from '../../application/tier-settings.service';
import { TierSettings } from '../../domain/tier-settings.entity';
import { TierSettingsAdminResponseDto } from './dto/response/tier-settings-admin.response.dto';
import { UpdateTierSettingsAdminRequestDto } from './dto/request/update-tier-settings-admin.request.dto';

@Controller('admin/tier-settings')
@ApiTags('Admin Tier Settings')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class TierSettingsAdminController {
    constructor(private readonly tierSettingsService: TierSettingsService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get tier settings / 티어 설정 조회',
        description: '시스템의 전반적인 티어 심사 설정을 조회합니다.',
    })
    @ApiStandardResponse(TierSettingsAdminResponseDto)
    async getSettings(): Promise<TierSettingsAdminResponseDto> {
        const settings = await this.tierSettingsService.find();
        return this.mapToResponseDto(settings);
    }

    @Put()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update tier settings / 티어 설정 수정',
        description: `
티어 승급 및 강등 심사 활성화 여부를 수정합니다.
**주의**: 배치 심사 시간(evaluationHourUtc)은 이 API를 통해 수정할 수 없습니다.
    `,
    })
    @ApiStandardResponse(TierSettingsAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_TIER_SETTINGS',
        category: 'TIER',
        extractMetadata: (_, args) => {
            const [dto] = args;
            return {
                isPromotionEnabled: dto?.isPromotionEnabled,
                isDowngradeEnabled: dto?.isDowngradeEnabled,
            };
        },
    })
    async updateSettings(
        @Body() dto: UpdateTierSettingsAdminRequestDto,
        @CurrentUser() admin: AuthenticatedUser,
    ): Promise<TierSettingsAdminResponseDto> {
        const settings = await this.tierSettingsService.update({
            ...dto,
            updatedBy: admin.id,
        });
        return this.mapToResponseDto(settings);
    }

    private mapToResponseDto(settings: TierSettings): TierSettingsAdminResponseDto {
        return {
            isPromotionEnabled: settings.isPromotionEnabled,
            isDowngradeEnabled: settings.isDowngradeEnabled,
            evaluationHourUtc: settings.evaluationHourUtc,
            updatedAt: settings.updatedAt,
            updatedBy: settings.updatedBy?.toString() ?? null,
        };
    }
}
