import { Controller, Get, Post, Body, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../../../common/auth/guards/session-auth.guard';
import { RequireRoles } from '../../../../common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { FindWageringRequirementsService } from '../../application/find-wagering-requirements.service';
import { WageringRequirementAdminResponseDto } from './dto/response/wagering-requirement-admin.response.dto';
import { GetWageringRequirementsAdminQueryDto } from './dto/request/get-wagering-requirements-admin-query.dto';
import { PaginatedWageringRequirementAdminResponseDto } from './dto/response/paginated-wagering-requirement-admin.response.dto';
import { VoidWageringRequirementDto } from './dto/request/void-wagering.dto';
import { plainToInstance } from 'class-transformer';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../../ports';
import type { WageringRequirementRepositoryPort } from '../../ports';
import { AuditLog } from '../../../../modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from '../../../../modules/audit-log/domain';
import { WageringRequirementNotFoundException } from '../../domain';
import { Paginated } from '../../../../common/http/decorators/paginated.decorator';

@ApiTags('Admin Wagering Requirements')
@Controller('admin/wagering-requirements')
@UseGuards(SessionAuthGuard)
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class WageringRequirementAdminController {
    constructor(
        private readonly findService: FindWageringRequirementsService,
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
    ) { }

    @Get()
    @Paginated()
    @ApiOperation({ summary: 'Find wagering requirements with filters (필터로 롤링 조건 조회)' })
    @ApiResponse({ type: PaginatedWageringRequirementAdminResponseDto })
    async list(@Query() query: GetWageringRequirementsAdminQueryDto): Promise<any> {
        const paginatedData = await this.findService.findPaginated({
            userId: query.userId ? BigInt(query.userId) : undefined,
            statuses: query.statuses,
            sourceType: query.sourceType,
            currency: query.currency,
            fromAt: query.fromAt,
            toAt: query.toAt,
            page: query.page!,
            limit: query.limit!,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });

        const mappedData = paginatedData.data.map(item => ({
            id: item.id?.toString(),
            userId: item.userId?.toString(),
            uid: item.uid,
            currency: item.currency,
            sourceType: item.sourceType,
            requiredAmount: item.requiredAmount?.toString(),
            currentAmount: item.currentAmount?.toString(),
            remainingAmount: item.remainingAmount?.toString(),
            status: item.status,
            priority: item.priority,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            expiresAt: item.expiresAt,
            completedAt: item.completedAt,
            cancelledAt: item.cancelledAt,
            cancellationNote: item.cancellationNote,
            depositDetailId: item.depositDetailId?.toString(),
            userPromotionId: item.userPromotionId?.toString(),
            cancellationBalanceThreshold: item.cancellationBalanceThreshold?.toString(),
        }));

        return {
            data: mappedData,
            page: paginatedData.page,
            limit: paginatedData.limit,
            total: paginatedData.total,
        };
    }

    @Post(':id/void')
    @ApiOperation({ summary: 'Void a wagering requirement (롤링 조건 무효화)' })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VOID_WAGERING',
        category: 'ADMIN',
        // 로그의 주체를 대상 유저로 지정 (검색 편의성)
        userId: (_req, _args, result) => result?.userId,
        extractMetadata: (req, _args, _res, _err) => ({
            reason: req.body.reason,
            wageringId: req.params.id,
        }),
    })
    async voidRequirement(
        @Param('id') id: string,
        @Body() dto: VoidWageringRequirementDto,
    ): Promise<WageringRequirementAdminResponseDto> {
        const requirement = await this.findService.findById(BigInt(id));
        if (!requirement) {
            throw new WageringRequirementNotFoundException(id);
        }

        // Domain method to void
        requirement.void(dto.reason);

        // Persist via repository
        const updated = await this.repository.save(requirement);

        return plainToInstance(WageringRequirementAdminResponseDto, updated, { excludeExtraneousValues: true });
    }
}
