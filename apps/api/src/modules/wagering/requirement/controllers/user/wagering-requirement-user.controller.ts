import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../common/auth/types/auth.types';
import {
    FindWageringRequirementsService,
    CheckWageringRequirementService,
    ForfeitWageringRequirementService
} from '../../application';
import { GetMyWageringRequirementsQueryDto } from './dto/request/get-my-wagering-requirements-query.dto';
import { WageringRequirementUserResponseDto } from './dto/response/wagering-requirement-user.response.dto';
import { WageringSummaryUserResponseDto } from './dto/response/wagering-summary-user.response.dto';
import { Paginated } from '../../../../../common/http/decorators/paginated.decorator';
import { SqidsService } from '../../../../../common/sqids/sqids.service';
import { SqidsPrefix } from '../../../../../common/sqids/sqids.constants';
import { ApiStandardResponse, ApiStandardErrors } from '../../../../../common/http/decorators/api-response.decorator';
import { Param, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

@ApiTags('User Wagering Requirement')
@Controller('user/wagering-requirements')
export class WageringRequirementUserController {
    constructor(
        private readonly findService: FindWageringRequirementsService,
        private readonly checkService: CheckWageringRequirementService,
        private readonly forfeitService: ForfeitWageringRequirementService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @Paginated()
    @ApiOperation({ summary: 'Get my wagering requirements / 내 롤링 조건 조회' })
    @ApiStandardResponse(WageringRequirementUserResponseDto)
    @ApiStandardErrors()
    async getMyRequirements(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: GetMyWageringRequirementsQueryDto,
    ): Promise<PaginatedData<WageringRequirementUserResponseDto>> {
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
            principalAmount: item.principalAmount.toString(),
            multiplier: Number(item.multiplier),
            requiredAmount: item.requiredAmount.toString(),
            fulfilledAmount: item.fulfilledAmount.toString(),
            remainingAmount: item.remainingAmount.toString(),
            progressRate: item.requiredAmount.isZero() ? 100 : item.fulfilledAmount.div(item.requiredAmount).mul(100).toNumber(),
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

    @Get('summary')
    @ApiOperation({ summary: 'Get wagering summary / 롤링 요약 정보 조회' })
    @ApiStandardResponse(WageringSummaryUserResponseDto)
    @ApiStandardErrors()
    async getSummary(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<WageringSummaryUserResponseDto> {
        const userId = BigInt(user.id);
        const summary = await this.checkService.getSummary(userId);

        return {
            activeCount: summary.activeCount,
            totalRemainingAmount: summary.totalRemainingAmount,
            isWithdrawalRestricted: summary.isRestricted,
            lastContributedAt: summary.lastContributedAt,
        };
    }

    @Post(':id/forfeit')
    @ApiOperation({ summary: 'Forfeit wagering requirement / 롤링 조건 포기' })
    @ApiStandardResponse()
    @ApiStandardErrors()
    async forfeit(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') sqid: string,
    ): Promise<void> {
        const id = this.sqidsService.decode(sqid, SqidsPrefix.WAGERING_REQUIREMENT);
        await this.forfeitService.execute({
            id,
            userId: BigInt(user.id),
        });
    }
}
