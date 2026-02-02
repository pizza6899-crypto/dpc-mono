import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequireRoles } from '../../../../../common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { GetWageringConfigService } from '../../application/get-wagering-config.service';
import { UpdateWageringConfigService } from '../../application/update-wagering-config.service';
import { CurrentUser } from '../../../../../common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../common/auth/types/auth.types';
import { AuditLog } from '../../../../audit-log/infrastructure/audit-log.decorator';
import { LogType } from '../../../../audit-log/domain';
import { UpdateWageringConfigDto } from './dto/request/update-wagering-config.dto';
import { WageringConfigAdminResponseDto } from './dto/response/wagering-config-admin.response.dto';
import { WageringConfig } from '../../domain';

@ApiTags('Admin Wagering Config')
@Controller('admin/wagering-configs')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class WageringConfigAdminController {
    constructor(
        private readonly getService: GetWageringConfigService,
        private readonly updateService: UpdateWageringConfigService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get global wagering config (글로벌 롤링 설정 조회)' })
    @ApiResponse({ type: WageringConfigAdminResponseDto })
    async getConfig(): Promise<WageringConfigAdminResponseDto> {
        const config = await this.getService.execute();
        return this.mapToResponse(config);
    }

    @Patch()
    @ApiOperation({ summary: 'Update global wagering config (글로벌 롤링 설정 수정)' })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_WAGERING_CONFIG',
        category: 'ADMIN',
        extractMetadata: (req) => ({
            updates: req.body
        })
    })
    @ApiResponse({ type: WageringConfigAdminResponseDto })
    async updateConfig(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: UpdateWageringConfigDto,
    ): Promise<WageringConfigAdminResponseDto> {
        const updated = await this.updateService.execute({
            ...body,
            adminUserId: BigInt(user.id),
        });

        return this.mapToResponse(updated);
    }

    private mapToResponse(config: WageringConfig): WageringConfigAdminResponseDto {
        const rawSettings: Record<string, any> = {};
        for (const [currency, setting] of Object.entries(config.currencySettings)) {
            rawSettings[currency] = setting.toRaw();
        }

        return {
            defaultBonusExpiryDays: config.defaultBonusExpiryDays,
            currencySettings: rawSettings,
            isWageringCheckEnabled: config.isWageringCheckEnabled,
            isAutoCancellationEnabled: config.isAutoCancellationEnabled,
            updatedAt: config.updatedAt,
            updatedBy: config.updatedBy?.toString() || null,
        };
    }
}
