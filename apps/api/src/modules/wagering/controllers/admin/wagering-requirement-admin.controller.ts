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
    @ApiOperation({ summary: 'Find wagering requirements by User ID (유저 ID로 롤링 조건 조회)' })
    @ApiResponse({ type: PaginatedWageringRequirementAdminResponseDto })
    async findByUserId(@Query() query: GetWageringRequirementsAdminQueryDto): Promise<PaginatedWageringRequirementAdminResponseDto> {
        const paginatedData = await this.findService.findPaginated({
            userId: BigInt(query.userId),
            statuses: query.statuses,
            page: query.page!,
            limit: query.limit!,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });

        return {
            success: true,
            data: plainToInstance(WageringRequirementAdminResponseDto, paginatedData.data, { excludeExtraneousValues: true }),
            pagination: {
                page: paginatedData.page,
                limit: paginatedData.limit,
                total: paginatedData.total,
            },
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
