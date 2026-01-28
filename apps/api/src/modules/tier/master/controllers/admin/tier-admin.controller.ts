import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { TierService } from '../../application/tier.service';
import { Tier } from '../../domain/tier.entity';
import { TierAdminResponseDto } from './dto/response/tier-admin.response.dto';
import { UpdateTierAdminRequestDto } from './dto/request/update-tier-admin.request.dto';

@Controller('admin/tiers')
@ApiTags('Admin Tiers')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class TierAdminController {
    constructor(private readonly tierService: TierService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'List all tiers / 전체 티어 목록 조회',
        description: '시스템에 설정된 모든 티어 정보와 혜택 목록을 조회합니다.',
    })
    @ApiStandardResponse(TierAdminResponseDto, { isArray: true })
    async getTiers(): Promise<TierAdminResponseDto[]> {
        const tiers = await this.tierService.findAll();
        return tiers.map(tier => this.mapToResponseDto(tier));
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get tier by ID / 티어 상세 조회',
        description: '특정 ID의 티어 상세 정보와 다국어 번역 정보를 조회합니다.',
    })
    @ApiStandardResponse(TierAdminResponseDto)
    async getTier(@Param('id') id: string): Promise<TierAdminResponseDto> {
        const tier = await this.tierService.findById(BigInt(id));
        return this.mapToResponseDto(tier);
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update tier / 티어 정보 수정',
        description: '티어의 승급 조건, 혜택, 다국어 명칭 등을 수정합니다.',
    })
    @ApiStandardResponse(TierAdminResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'UPDATE_TIER',
        category: 'TIER',
        extractMetadata: (req) => ({
            tierId: req.params.id,
            before: req.__audit_before,
            after: req.__audit_after,
        }),
    })
    async updateTier(
        @Param('id') id: string,
        @Body() dto: UpdateTierAdminRequestDto,
        @CurrentUser() admin: AuthenticatedUser,
        @Req() req: any,
    ): Promise<TierAdminResponseDto> {
        const tierId = BigInt(id);

        // Audit log용 이전 상태 기록
        const before = await this.tierService.findById(tierId);

        const updated = await this.tierService.update({
            id: tierId,
            ...dto,
            updatedBy: admin.id,
        });

        // Audit log 메타데이터 세팅
        req.__audit_before = this.mapToAuditData(before);
        req.__audit_after = this.mapToAuditData(updated);

        return this.mapToResponseDto(updated);
    }

    private mapToResponseDto(tier: Tier): TierAdminResponseDto {
        return {
            id: tier.id.toString(),
            priority: tier.priority,
            code: tier.code,
            requirementUsd: tier.requirementUsd.toString(),
            requirementDepositUsd: tier.requirementDepositUsd.toString(),
            maintenanceRollingUsd: tier.maintenanceRollingUsd.toString(),
            evaluationCycle: tier.evaluationCycle,
            levelUpBonusUsd: tier.levelUpBonusUsd.toString(),
            levelUpBonusWageringMultiplier: tier.levelUpBonusWageringMultiplier.toString(),
            compRate: tier.compRate.toString(),
            lossbackRate: tier.lossbackRate.toString(),
            rakebackRate: tier.rakebackRate.toString(),
            reloadBonusRate: tier.reloadBonusRate.toString(),
            dailyWithdrawalLimitUsd: tier.dailyWithdrawalLimitUsd.toString(),
            isWithdrawalUnlimited: tier.isWithdrawalUnlimited,
            hasDedicatedManager: tier.hasDedicatedManager,
            isVIPEventEligible: tier.isVIPEventEligible,
            imageUrl: tier.imageUrl,
            translations: tier.translations.map(t => ({
                language: t.language,
                name: t.name,
                description: t.description,
            })),
            updatedAt: tier.updatedAt,
            updatedBy: tier.updatedBy?.toString() ?? null,
        };
    }

    private mapToAuditData(tier: Tier) {
        return {
            priority: tier.priority,
            code: tier.code,
            requirements: {
                rolling: tier.requirementUsd.toString(),
                deposit: tier.requirementDepositUsd.toString(),
            },
            benefits: {
                comp: tier.compRate.toString(),
                rakeback: tier.rakebackRate.toString(),
                lossback: tier.lossbackRate.toString(),
            }
        };
    }
}
