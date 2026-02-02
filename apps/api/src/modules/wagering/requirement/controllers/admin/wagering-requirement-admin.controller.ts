import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from '../../../../../common/auth/decorators/roles.decorator';
import { FindWageringRequirementsService } from '../../application/find-wagering-requirements.service';
import { GetWageringRequirementsAdminQueryDto } from './dto/request/get-wagering-requirements-admin-query.dto';
import { WageringRequirementAdminResponseDto } from './dto/response/wagering-requirement-admin.response.dto';
import { VoidWageringRequirementDto } from './dto/request/void-wagering.dto';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../../ports';
import type { WageringRequirementRepositoryPort } from '../../ports';
import { AuditLog } from '../../../../../modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from '../../../../../modules/audit-log/domain';
import { WageringRequirementNotFoundException, WageringRequirement } from '../../domain';
import { Paginated } from '../../../../../common/http/decorators/paginated.decorator';
import { ApiStandardResponse, ApiStandardErrors } from '../../../../../common/http/decorators/api-response.decorator';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

@ApiTags('Admin Wagering Requirements')
@Controller('admin/wagering-requirements')
@Admin()
export class WageringRequirementAdminController {
    constructor(
        private readonly findService: FindWageringRequirementsService,
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
    ) { }

    @Get()
    @Paginated()
    @ApiOperation({ summary: 'Find wagering requirements with filters / 필터로 롤링 조건 조회' })
    @ApiStandardResponse(WageringRequirementAdminResponseDto)
    @ApiStandardErrors()
    async list(@Query() query: GetWageringRequirementsAdminQueryDto): Promise<PaginatedData<WageringRequirementAdminResponseDto>> {
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

        const mappedData = paginatedData.data.map(item => this.mapToResponse(item));

        return {
            data: mappedData,
            page: paginatedData.page,
            limit: paginatedData.limit,
            total: paginatedData.total,
        };
    }

    @Post(':id/void')
    @ApiOperation({ summary: 'Void a wagering requirement / 롤링 조건 무효화' })
    @AuditLog({
        type: LogType.ACTIVITY,
        action: 'VOID_WAGERING',
        category: 'ADMIN',
        userId: (_req, _args, result) => result?.userId,
        extractMetadata: (req) => ({
            reason: req.body.reason,
            wageringId: req.params.id,
        }),
    })
    @ApiStandardResponse(WageringRequirementAdminResponseDto)
    @ApiStandardErrors()
    async voidRequirement(
        @Param('id') id: string,
        @Body() dto: VoidWageringRequirementDto,
    ): Promise<WageringRequirementAdminResponseDto> {
        const requirement = await this.findService.findById(BigInt(id));
        if (!requirement) {
            throw new WageringRequirementNotFoundException(id);
        }

        requirement.void(dto.reason);
        const updated = await this.repository.save(requirement);

        return this.mapToResponse(updated);
    }

    private mapToResponse(item: WageringRequirement): WageringRequirementAdminResponseDto {
        return {
            id: item.id?.toString() || '0',
            userId: item.userId?.toString() || '0',
            currency: item.currency,
            sourceType: item.sourceType,
            requiredAmount: item.requiredAmount?.toString(),
            fulfilledAmount: item.fulfilledAmount?.toString(),
            remainingAmount: item.remainingAmount?.toString(),
            principalAmount: item.principalAmount?.toString(),
            multiplier: item.multiplier?.toString(),
            lockedAmount: item.lockedAmount?.toString(),
            maxCashConversion: item.maxCashConversion?.toString() || null,
            convertedAmount: item.convertedAmount?.toString() || null,
            isPaused: item.isPaused,
            isAutoCancelable: item.isAutoCancelable,
            status: item.status,
            priority: item.priority,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            expiresAt: item.expiresAt,
            lastContributedAt: item.lastContributedAt,
            completedAt: item.completedAt,
            cancelledAt: item.cancelledAt,
            cancellationNote: item.cancellationNote,
            cancellationReasonType: item.cancellationReasonType,
            cancelledBy: item.cancelledBy,
            balanceAtCancellation: item.balanceAtCancellation?.toString() || null,
            forfeitedAmount: item.forfeitedAmount?.toString() || null,
            depositDetailId: item.depositDetailId?.toString() || null,
            userPromotionId: item.userPromotionId?.toString() || null,
            autoCancelThreshold: item.autoCancelThreshold?.toString() || null,
        };
    }
}
