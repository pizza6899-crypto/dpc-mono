import { Controller, Get, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../common/auth/types/auth.types';
import {
  FindWageringRequirementsService,
  CheckWageringRequirementService,
  ForfeitWageringRequirementService,
} from '../../application';
import { GetMyWageringRequirementsQueryDto } from './dto/request/get-my-wagering-requirements-query.dto';
import { GetWageringSummaryQueryDto } from './dto/request/get-wagering-summary-query.dto';
import { WageringRequirementUserResponseDto } from './dto/response/wagering-requirement-user.response.dto';
import { WageringSummaryUserResponseDto } from './dto/response/wagering-summary-user.response.dto';
import { SqidsService } from '../../../../../common/sqids/sqids.service';
import { SqidsPrefix } from '../../../../../common/sqids/sqids.constants';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from '../../../../../common/http/decorators/api-response.decorator';
import { Param, Post } from '@nestjs/common';
import type { PaginatedData } from 'src/common/http/types/pagination.types';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';

@ApiTags('User Wagering Requirement')
@Controller('user/wagering-requirements')
export class WageringRequirementUserController {
  constructor(
    private readonly findService: FindWageringRequirementsService,
    private readonly checkService: CheckWageringRequirementService,
    private readonly forfeitService: ForfeitWageringRequirementService,
    private readonly sqidsService: SqidsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my wagering requirements / 내 롤링 조건 조회' })
  @ApiPaginatedResponse(WageringRequirementUserResponseDto)
  @ApiStandardErrors()
  async getMyRequirements(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMyWageringRequirementsQueryDto,
  ): Promise<PaginatedData<WageringRequirementUserResponseDto>> {
    const paginatedData = await this.findService.findPaginated({
      userId: user.id,
      statuses: query.statuses || ['ACTIVE'], // 기본값: 진행 중인 롤링만
      currency: query.currency,
      fromAt: query.fromAt,
      toAt: query.toAt,
      page: query.page!,
      limit: query.limit!,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      ...paginatedData,
      data: paginatedData.data.map((item) => ({
        id: this.sqidsService.encode(item.id, SqidsPrefix.WAGERING_REQUIREMENT),
        currency: item.currency,
        principalAmount: item.principalAmount.toString(),
        multiplier: item.multiplier.toNumber(),
        targetType: item.targetType,
        requiredAmount: item.requiredAmount.toString(),
        wageredAmount: item.wageredAmount.toString(),
        remainingAmount: item.remainingAmount.toString(),
        requiredCount: item.requiredCount,
        wageredCount: item.wageredCount,
        remainingCount: item.remainingCount,
        accumulatedBetAmount: item.accumulatedBetAmount.toString(),
        progressRate: item.progressRate,
        status: item.status,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
      })),
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get wagering summary / 롤링 요약 정보 조회' })
  @ApiStandardResponse(WageringSummaryUserResponseDto)
  @ApiStandardErrors()
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetWageringSummaryQueryDto,
  ): Promise<WageringSummaryUserResponseDto> {
    const summary = await this.checkService.getSummary(
      user.id,
      query.currency || 'USD',
    );

    const totalRequired = new Prisma.Decimal(summary.totalRequiredAmount);
    const totalFulfilled = new Prisma.Decimal(summary.totalFulfilledAmount);

    const totalProgressRate = totalRequired.isZero()
      ? 100
      : totalFulfilled.div(totalRequired).mul(100).toNumber();

    return {
      currency: summary.currency,
      activeCount: summary.activeCount,
      totalRemainingAmount: summary.totalRemainingAmount,
      totalRequiredAmount: summary.totalRequiredAmount,
      totalProgressRate: Math.min(100, Math.max(0, totalProgressRate)), // 0-100 사이 보정
      isWithdrawalRestricted: summary.isRestricted,
      lastContributedAt: summary.lastContributedAt,
    };
  }

  @Post(':id/forfeit')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'WAGERING',
    action: 'FORFEIT',
    extractMetadata: (req) => ({ id: req.params.id }),
  })
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
