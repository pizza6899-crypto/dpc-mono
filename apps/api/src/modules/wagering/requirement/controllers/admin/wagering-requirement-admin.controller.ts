import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from '../../../../../common/auth/decorators/roles.decorator';
import {
  FindWageringRequirementsService,
  VoidWageringRequirementService,
  FindWageringContributionLogsService,
} from '../../application';
import { GetWageringRequirementsAdminQueryDto } from './dto/request/get-wagering-requirements-admin-query.dto';
import { WageringRequirementAdminResponseDto } from './dto/response/wagering-requirement-admin.response.dto';
import { WageringContributionLogResponseDto } from './dto/response/wagering-contribution-log.response.dto';
import { VoidWageringRequirementDto } from './dto/request/void-wagering.dto';
import { AuditLog } from '../../../../../modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from '../../../../../modules/audit-log/domain';
import { WageringRequirement } from '../../domain';
import { Paginated } from '../../../../../common/http/decorators/paginated.decorator';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../../common/http/decorators/api-response.decorator';
import { CurrentUser } from '../../../../../common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../common/auth/types/auth.types';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

@ApiTags('Admin Wagering Requirements')
@Controller('admin/wagering-requirements')
@Admin()
export class WageringRequirementAdminController {
  constructor(
    private readonly findService: FindWageringRequirementsService,
    private readonly voidService: VoidWageringRequirementService,
    private readonly findLogsService: FindWageringContributionLogsService,
  ) {}

  @Get()
  @Paginated()
  @ApiOperation({
    summary: 'Find wagering requirements with filters / 필터로 롤링 조건 조회',
  })
  @ApiStandardResponse(WageringRequirementAdminResponseDto)
  @ApiStandardErrors()
  async list(
    @Query() query: GetWageringRequirementsAdminQueryDto,
  ): Promise<PaginatedData<WageringRequirementAdminResponseDto>> {
    const paginatedData = await this.findService.findPaginated({
      userId: query.userId ? BigInt(query.userId) : undefined,
      statuses: query.statuses,
      sourceType: query.sourceType,
      sourceId: query.sourceId ? BigInt(query.sourceId) : undefined,
      currency: query.currency,
      fromAt: query.fromAt,
      toAt: query.toAt,
      page: query.page!,
      limit: query.limit!,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const mappedData = paginatedData.data.map((item) =>
      this.mapToResponse(item),
    );

    return {
      data: mappedData,
      page: paginatedData.page,
      limit: paginatedData.limit,
      total: paginatedData.total,
    };
  }

  @Get(':id/logs')
  @ApiOperation({
    summary:
      'Get contribution logs for a wagering requirement / 특정 롤링 조건의 기여 로그 조회',
  })
  @ApiStandardResponse(WageringContributionLogResponseDto, { isArray: true })
  @ApiStandardErrors()
  async getLogs(
    @Param('id') id: string,
  ): Promise<WageringContributionLogResponseDto[]> {
    const logs = await this.findLogsService.execute(BigInt(id));
    return logs.map((log) => ({
      id: log.id.toString(),
      wageringRequirementId: log.wageringRequirementId.toString(),
      gameRoundId: log.gameRoundId.toString(),
      requestAmount: log.requestAmount.toString(),
      contributionRate: log.contributionRate.toString(),
      wageredAmount: log.wageredAmount.toString(),
      createdAt: log.createdAt,
    }));
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
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VoidWageringRequirementDto,
  ): Promise<WageringRequirementAdminResponseDto> {
    const updated = await this.voidService.execute({
      id: BigInt(id),
      reason: dto.reason,
      adminUserId: BigInt(user.id),
    });

    return this.mapToResponse(updated);
  }

  private mapToResponse(
    item: WageringRequirement,
  ): WageringRequirementAdminResponseDto {
    return {
      id: item.id?.toString() || '0',
      userId: item.userId?.toString() || '0',
      currency: item.currency,
      sourceType: item.sourceType,
      targetType: item.targetType,
      requiredAmount: item.requiredAmount?.toString(),
      wageredAmount: item.wageredAmount?.toString(),
      requiredCount: item.requiredCount,
      wageredCount: item.wageredCount,
      remainingAmount: item.remainingAmount?.toString(),
      remainingCount: item.remainingCount,
      principalAmount: item.principalAmount?.toString(),
      multiplier: item.multiplier?.toString(),
      bonusAmount: item.bonusAmount?.toString(),
      initialFundAmount: item.initialFundAmount?.toString(),
      currentBalance: item.currentBalance?.toString(),
      totalBetAmount: item.totalBetAmount?.toString(),
      totalWinAmount: item.totalWinAmount?.toString(),
      realMoneyRatio: item.realMoneyRatio?.toString(),
      isForfeitable: item.isForfeitable,
      maxCashConversion: item.maxCashConversion?.toString() || null,
      convertedAmount: item.convertedAmount?.toString() || null,
      isPaused: item.isPaused,
      isAutoCancelable: item.isAutoCancelable,
      status: item.status,
      priority: item.priority,
      sourceId: item.sourceId?.toString(),
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
    };
  }
}
