import { Controller, Get, Post, Param, UseGuards, Query, BadRequestException, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/model/user.entity';
import { GetAvailableRewardsService } from '../../application/get-available-rewards.service';
import { ClaimRewardService } from '../../application/claim-reward.service';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { ApiStandardResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { TierRewardResponseDto } from './dto/response/tier-reward.response.dto';
import { GetAvailableRewardsQueryDto } from './dto/request/get-available-rewards-query.dto';
import { ClaimRewardRequestDto } from './dto/request/claim-reward.request.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('User Tier Rewards')
@Controller('tiers/rewards')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@ApiStandardErrors()
export class TierRewardController {
    constructor(
        private readonly getAvailableRewardsService: GetAvailableRewardsService,
        private readonly claimRewardService: ClaimRewardService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get('available')
    @ApiOperation({ summary: 'Get available rewards / 수령 가능한 보상 목록 조회' })
    @ApiStandardResponse(TierRewardResponseDto, { isArray: true })
    async getAvailableRewards(
        @CurrentUser() user: User,
        @Query() query: GetAvailableRewardsQueryDto,
    ): Promise<TierRewardResponseDto[]> {
        const rewards = await this.getAvailableRewardsService.execute(user.id, query.lang);

        return rewards.map(r => ({
            id: this.sqidsService.encode(r.id, SqidsPrefix.TIER_REWARD),
            tierName: r.tier?.getName(query.lang) ?? '',
            amount: r.bonusAmountUsd.toFixed(2),
            currency: 'USD',
            wageringMultiplier: r.wageringMultiplier.toFixed(2),
            expiresAt: r.expiresAt,
            createdAt: r.createdAt,
        }));
    }

    @Post(':id/claim')
    @ApiOperation({ summary: 'Claim a reward / 보상 수령(청구)' })
    @ApiParam({ name: 'id', description: 'Reward ID (SQID) / 보상 ID (SQID)' })
    @ApiStandardResponse()
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'CLAIM_REWARD',
        extractMetadata: (req) => ({
            rewardId: req.params.id,
            currency: req.body.currency,
        }),
    })
    async claimReward(
        @CurrentUser() user: User,
        @Param('id') encodedId: string,
        @Body() body: ClaimRewardRequestDto,
    ): Promise<void> {
        const rewardId = this.sqidsService.decode(encodedId, SqidsPrefix.TIER_REWARD);
        if (!rewardId) {
            throw new BadRequestException('Invalid reward ID / 유효하지 않은 보상 ID입니다.');
        }

        await this.claimRewardService.execute(user.id, rewardId, body.currency);
    }
}
