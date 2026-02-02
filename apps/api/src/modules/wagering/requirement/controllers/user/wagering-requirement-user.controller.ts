import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../common/auth/types/auth.types';
import { FindWageringRequirementsService } from '../../application/find-wagering-requirements.service';
import { GetMyWageringRequirementsQueryDto } from './dto/request/get-my-wagering-requirements-query.dto';
import { PaginatedWageringRequirementUserResponseDto } from './dto/response/paginated-wagering-requirement-user.response.dto';
import { Paginated } from '../../../../../common/http/decorators/paginated.decorator';
import { SqidsService } from '../../../../../common/sqids/sqids.service';
import { SqidsPrefix } from '../../../../../common/sqids/sqids.constants';

@ApiTags('User Wagering Requirement')
@Controller('user/wagering-requirements')
export class WageringRequirementUserController {
    constructor(
        private readonly findService: FindWageringRequirementsService,
        private readonly sqidsService: SqidsService,
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
            id: this.sqidsService.encode(item.id!, SqidsPrefix.WAGERING_REQUIREMENT),
            currency: item.currency,
            requiredAmount: item.requiredAmount?.toString(),
            fulfilledAmount: item.fulfilledAmount?.toString(),
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
