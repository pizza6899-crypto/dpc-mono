import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUserTierService } from '../../application/get-user-tier.service';
import { GetUserTierHistoryService } from '../../application/get-user-tier-history.service';
import { UserTierResponseDto } from './dto/response/user-tier.response.dto';
import { UserTierHistoryResponseDto } from './dto/response/user-tier-history.response.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { User } from 'src/modules/user/domain/model/user.entity';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@ApiTags('User Tiers')
@Controller('tiers')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
export class UserTierController {
    constructor(
        private readonly getUserTierService: GetUserTierService,
        private readonly getUserTierHistoryService: GetUserTierHistoryService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get('my')
    @ApiOperation({ summary: 'Get my tier status and progress / 내 티어 상태 및 진행률 조회' })
    @ApiOkResponse({ type: UserTierResponseDto })
    async getMyTier(@CurrentUser() user: User): Promise<UserTierResponseDto> {
        const result = await this.getUserTierService.execute(user.id);

        return {
            id: this.sqidsService.encode(result.id, SqidsPrefix.USER_TIER),
            name: result.name,
            priority: result.priority,
            imageUrl: result.imageUrl,
            status: result.status,
            lastChangedAt: result.lastTierChangedAt,
            nextEvaluationAt: result.nextEvaluationAt,
            benefits: {
                compRate: result.benefits.compRate.toString(),
                lossbackRate: result.benefits.lossbackRate.toString(),
                rakebackRate: result.benefits.rakebackRate.toString(),
                reloadBonusRate: result.benefits.reloadBonusRate.toString(),
                dailyWithdrawalLimitUsd: result.benefits.dailyWithdrawalLimitUsd.toString(),
                isWithdrawalUnlimited: result.benefits.isWithdrawalUnlimited,
                hasDedicatedManager: result.benefits.hasDedicatedManager,
                isVIPEventEligible: result.benefits.isVIPEventEligible,
            },
            nextTierProgress: result.nextTierProgress ? {
                name: result.nextTierProgress.name,
                requiredRolling: result.nextTierProgress.requiredRolling.toString(),
                currentRolling: result.nextTierProgress.currentRolling.toString(),
                remainingRolling: result.nextTierProgress.remainingRolling.toString(),
                rollingProgressPercent: result.nextTierProgress.rollingProgressPercent,
                requiredDeposit: result.nextTierProgress.requiredDeposit.toString(),
                currentDeposit: result.nextTierProgress.currentDeposit.toString(),
                remainingDeposit: result.nextTierProgress.remainingDeposit.toString(),
                depositProgressPercent: result.nextTierProgress.depositProgressPercent,
            } : null,
        };
    }

    @Get('my/history')
    @ApiOperation({ summary: 'Get my tier change history / 내 티어 변경 이력 조회' })
    @ApiOkResponse({ type: [UserTierHistoryResponseDto] })
    async getMyTierHistory(@CurrentUser() user: User): Promise<UserTierHistoryResponseDto[]> {
        const history = await this.getUserTierHistoryService.execute(user.id);

        return history.map(h => ({
            id: this.sqidsService.encode(h.id, SqidsPrefix.USER_TIER), // Using USER_TIER prefix for history recs or separate if exists
            fromTierId: h.fromTierId ? this.sqidsService.encode(h.fromTierId, SqidsPrefix.TIER) : null,
            toTierId: this.sqidsService.encode(h.toTierId, SqidsPrefix.TIER),
            changeType: h.changeType,
            reason: h.reason,
            changedAt: h.changedAt,
            rollingAmountSnap: h.rollingAmountSnap.toString(),
            depositAmountSnap: h.depositAmountSnap.toString(),
        }));
    }
}
