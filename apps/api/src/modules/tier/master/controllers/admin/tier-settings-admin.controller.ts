import { Body, Controller, Get, HttpCode, HttpStatus, Put, Req } from '@nestjs/common';
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
        description: 'Retrieves the overall tier evaluation settings of the system. / 시스템의 전반적인 티어 심사 설정을 조회합니다.',
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
Enables or disables tier promotion and downgrade evaluation. / 티어 승급 및 강등 심사 활성화 여부를 수정합니다.
**Note**: The evaluation batch hour (evaluationHourUtc) cannot be modified through this API. / **주의**: 배치 심사 시간(evaluationHourUtc)은 이 API를 통해 수정할 수 없습니다.
    `,
    })
    @ApiStandardResponse(TierSettingsAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_TIER_SETTINGS',
        category: 'TIER',
        extractMetadata: (req) => {
            return {
                before: req.__audit_before,
                after: req.__audit_after,
            };
        },
    })
    async updateSettings(
        @Body() dto: UpdateTierSettingsAdminRequestDto,
        @CurrentUser() admin: AuthenticatedUser,
        @Req() req: any,
    ): Promise<TierSettingsAdminResponseDto> {
        // [1] 변경 전 데이터 조회
        const before = await this.tierSettingsService.find();

        const settings = await this.tierSettingsService.update({
            ...dto,
            updatedBy: admin.id,
        });

        // [2] 감사 로그용 메타데이터 기록 (Interceptor에서 사용)
        req.__audit_before = {
            isPromotionEnabled: before.isPromotionEnabled,
            isDowngradeEnabled: before.isDowngradeEnabled,
        };
        req.__audit_after = {
            isPromotionEnabled: settings.isPromotionEnabled,
            isDowngradeEnabled: settings.isDowngradeEnabled,
        };

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
