import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../../../common/auth/guards/session-auth.guard';
import { CurrentUser } from '../../../../common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../common/auth/types/auth.types';
import { FindWageringRequirementsService } from '../../application/find-wagering-requirements.service';
import { GetMyWageringRequirementsQueryDto } from './dto/request/get-my-wagering-requirements-query.dto';
import { WageringRequirementUserResponseDto } from './dto/response/wagering-requirement-user.response.dto';
import { PaginatedWageringRequirementUserResponseDto } from './dto/response/paginated-wagering-requirement-user.response.dto';
import { Paginated } from '../../../../common/http/decorators/paginated.decorator';

@ApiTags('Wagering Requirements')
@Controller('user/wagering-requirements')
@UseGuards(SessionAuthGuard)
export class WageringRequirementUserController {
    constructor(
        private readonly findService: FindWageringRequirementsService,
    ) { }

    @Get()
    @Paginated()
    @ApiOperation({ summary: 'Get my wagering requirements (내 롤링 조건 조회)' })
    @ApiResponse({ type: PaginatedWageringRequirementUserResponseDto })
    async getMyRequirements(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: GetMyWageringRequirementsQueryDto,
    ): Promise<any> {
        const paginatedData = await this.findService.findPaginated({
            userId: user.id,
            statuses: query.statuses,
            currency: query.currency,
            sourceType: query.sourceType,
            fromAt: query.fromAt,
            toAt: query.toAt,
            page: query.page!,
            limit: query.limit!,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });

        const mappedData = paginatedData.data.map(item => ({
            uid: item.uid,
            currency: item.currency,
            requiredAmount: item.requiredAmount?.toString(),
            currentAmount: item.currentAmount?.toString(),
            remainingAmount: item.remainingAmount?.toString(),
            status: item.status,
            expiresAt: item.expiresAt,
            createdAt: item.createdAt,
        }));

        return {
            data: mappedData,
            page: paginatedData.page,
            limit: paginatedData.limit,
            total: paginatedData.total,
        };
    }
}
