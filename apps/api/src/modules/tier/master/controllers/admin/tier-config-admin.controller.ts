import { Body, Controller, Get, HttpCode, HttpStatus, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { TierConfigService } from '../../application/tier-config.service';
import { TierConfig } from '../../domain/tier-config.entity';
import { TierConfigAdminResponseDto } from './dto/response/tier-config-admin.response.dto';
import { UpdateTierConfigAdminRequestDto } from './dto/request/update-tier-config-admin.request.dto';

@Controller('admin/tier-config')
@ApiTags('Admin Tier Config')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class TierConfigAdminController {
    constructor(private readonly tierConfigService: TierConfigService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get tier config / 티어 설정 조회',
        description: 'Retrieves the overall tier evaluation configuration of the system. / 시스템의 전반적인 티어 심사 설정을 조회합니다.',
    })
    @ApiStandardResponse(TierConfigAdminResponseDto)
    async getConfig(): Promise<TierConfigAdminResponseDto> {
        const config = await this.tierConfigService.find();
        return this.mapToResponseDto(config);
    }

    @Put()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update tier config / 티어 설정 수정',
        description: `
Enables or disables tier promotion and downgrade evaluation. / 티어 승급 및 강등 심사 활성화 여부를 수정합니다.
**Note**: The evaluation batch hour (evaluationHourUtc) cannot be modified through this API. / **주의**: 배치 심사 시간(evaluationHourUtc)은 이 API를 통해 수정할 수 없습니다.
    `,
    })
    @ApiStandardResponse(TierConfigAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_TIER_CONFIG',
        category: 'TIER',
        extractMetadata: (req) => {
            return {
                before: req.__audit_before,
                after: req.__audit_after,
            };
        },
    })
    async updateConfig(
        @Body() dto: UpdateTierConfigAdminRequestDto,
        @CurrentUser() admin: AuthenticatedUser,
        @Req() req: Request & { __audit_before?: any; __audit_after?: any },
    ): Promise<TierConfigAdminResponseDto> {
        // [1] 변경 전 데이터 조회
        const before = await this.tierConfigService.find();

        const config = await this.tierConfigService.update({
            ...dto,
            updatedBy: admin.id,
        });

        // [2] 감사 로그용 메타데이터 기록 (Interceptor에서 사용)
        req.__audit_before = {
            isPromotionEnabled: before.isPromotionEnabled,
            isDowngradeEnabled: before.isDowngradeEnabled,
            isBonusEnabled: before.isBonusEnabled,
        };
        req.__audit_after = {
            isPromotionEnabled: config.isPromotionEnabled,
            isDowngradeEnabled: config.isDowngradeEnabled,
            isBonusEnabled: config.isBonusEnabled,
        };

        return this.mapToResponseDto(config);
    }

    private mapToResponseDto(config: TierConfig): TierConfigAdminResponseDto {
        return {
            isPromotionEnabled: config.isPromotionEnabled,
            isDowngradeEnabled: config.isDowngradeEnabled,
            isBonusEnabled: config.isBonusEnabled,
            defaultGracePeriodDays: config.defaultGracePeriodDays,
            triggerIntervalMinutes: config.triggerIntervalMinutes,
            updatedAt: config.updatedAt,
            updatedBy: config.updatedBy?.toString() ?? null,
        };
    }
}
