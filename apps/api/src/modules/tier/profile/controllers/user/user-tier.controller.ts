import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { GetMyTierService } from '../../application/get-my-tier.service';
import { GetNextTierProgressService } from '../../application/get-next-tier-progress.service';
import { GetUserTierHistoryService } from '../../application/get-user-tier-history.service';
import { TierRepositoryPort } from '../../../config/infrastructure/tier.repository.port';
import { UserTierResponseDto } from './dto/response/user-tier.response.dto';
import { UserTierHistoryResponseDto } from './dto/response/user-tier-history.response.dto';
import { GetUserTierQueryDto } from './dto/request/get-user-tier.query.dto';
import { GetUserTierHistoryQueryDto } from './dto/request/get-user-tier-history.query.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { User } from 'src/modules/user/profile/domain/model/user.entity';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@ApiTags('User Tiers')
@Controller('tiers')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
export class UserTierController {
  constructor(
    private readonly getMyTierService: GetMyTierService,
    private readonly getNextTierProgressService: GetNextTierProgressService,
    private readonly getUserTierHistoryService: GetUserTierHistoryService,
    private readonly tierRepository: TierRepositoryPort,
    private readonly sqidsService: SqidsService,
  ) {}

  @Get('my')
  @ApiOperation({
    summary: 'Get my tier status and progress / 내 티어 상태 및 진행률 조회',
  })
  @ApiOkResponse({ type: UserTierResponseDto })
  async getMyTier(
    @CurrentUser() user: User,
    @Query() query: GetUserTierQueryDto,
  ): Promise<UserTierResponseDto> {
    // 1. 필요한 데이터를 병렬로 조회 (DB I/O 최적화 - 전체 조회가 아닌 필요한 단건만 조회)
    const userTier = await this.getMyTierService.findUserTier(user.id);
    const nextTier = await this.tierRepository.findNextTierByLevel(
      userTier.currentLevel,
    );

    // 2. 가공 서비스를 통한 결과 생성 (엔티티를 직접 전달)
    const myTierResult = this.getMyTierService.execute(userTier, query.lang);
    const progressResult = this.getNextTierProgressService.execute(
      userTier,
      nextTier,
      query.lang,
    );

    return {
      id: this.sqidsService.encode(
        myTierResult.userTierId,
        SqidsPrefix.USER_TIER,
      ),
      tierId: this.sqidsService.encode(myTierResult.tierId, SqidsPrefix.TIER),
      code: myTierResult.code,
      name: myTierResult.name,
      level: myTierResult.level,
      imageUrl: myTierResult.imageUrl,
      status: myTierResult.status,
      lastChangedAt: myTierResult.lastTierChangedAt,
      nextEvaluationAt: myTierResult.nextEvaluationAt,
      benefits: {
        compRate: myTierResult.benefits.compRate.toFixed(4),
        weeklyLossbackRate: myTierResult.benefits.weeklyLossbackRate.toFixed(4),
        monthlyLossbackRate:
          myTierResult.benefits.monthlyLossbackRate.toFixed(4),
        dailyWithdrawalLimitUsd:
          myTierResult.benefits.dailyWithdrawalLimitUsd.toFixed(2),
        isWithdrawalUnlimited: myTierResult.benefits.isWithdrawalUnlimited,
        hasDedicatedManager: myTierResult.benefits.hasDedicatedManager,
      },
      nextTierProgress: progressResult
        ? {
            id: this.sqidsService.encode(progressResult.id, SqidsPrefix.TIER),
            name: progressResult.name,
            imageUrl: progressResult.imageUrl,
            requiredRolling: progressResult.requiredRolling.toFixed(2),
            currentRolling: progressResult.currentRolling.toFixed(2),
            remainingRolling: progressResult.remainingRolling.toFixed(2),
            rollingProgressPercent: Number(
              progressResult.rollingProgressPercent.toFixed(2),
            ),
            requiredDeposit: progressResult.requiredDeposit.toFixed(2),
            currentDeposit: progressResult.currentDeposit.toFixed(2),
            remainingDeposit: progressResult.remainingDeposit.toFixed(2),
            depositProgressPercent: Number(
              progressResult.depositProgressPercent.toFixed(2),
            ),
          }
        : null,
    };
  }

  @Get('my/history')
  @ApiOperation({
    summary: 'Get my tier change history / 내 티어 변경 이력 조회',
  })
  @Paginated()
  @ApiPaginatedResponse(UserTierHistoryResponseDto)
  async getMyTierHistory(
    @CurrentUser() user: User,
    @Query() query: GetUserTierHistoryQueryDto,
  ): Promise<PaginatedData<UserTierHistoryResponseDto>> {
    const history = await this.getUserTierHistoryService.execute(
      user.id,
      query,
    );

    return {
      data: history.data.map((h) => ({
        id: this.sqidsService.encode(h.id, SqidsPrefix.USER_TIER_HISTORY),
        fromTierId: h.fromTierId
          ? this.sqidsService.encode(h.fromTierId, SqidsPrefix.TIER)
          : null,
        toTierId: this.sqidsService.encode(h.toTierId, SqidsPrefix.TIER),
        changeType: h.changeType,
        changedAt: h.changedAt,
      })),
      page: history.page,
      limit: history.limit,
      total: history.total,
    };
  }
}
