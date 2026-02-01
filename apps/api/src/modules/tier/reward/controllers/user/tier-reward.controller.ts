import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/model/user.entity';
import { GetAvailableRewardsService } from '../../application/get-available-rewards.service';
import { ClaimRewardService } from '../../application/claim-reward.service';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { TierRewardResponseDto } from './dto/tier-reward.response.dto';
import { Language } from '@prisma/client';

@ApiTags('User Tier Rewards')
@Controller('tiers/rewards')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
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
        @Query('lang') lang?: Language,
    ): Promise<TierRewardResponseDto[]> {
        const rewards = await this.getAvailableRewardsService.execute(user.id, lang);

        return rewards.map(r => ({
            id: this.sqidsService.encode(r.id, SqidsPrefix.TIER_REWARD),
            tierName: r.tier?.getName(lang) ?? '',
            amount: r.bonusAmountUsd.toFixed(2),
            currency: 'USD',
            wageringMultiplier: r.wageringMultiplier.toFixed(2),
            expiresAt: r.expiresAt,
            createdAt: r.createdAt,
        }));
    }

    @Post(':id/claim')
    @ApiOperation({ summary: 'Claim a reward / 보상 수령(청구)' })
    @ApiOkResponse({ description: 'Reward claimed successfully' })
    async claimReward(
        @CurrentUser() user: User,
        @Param('id') encodedId: string,
    ): Promise<void> {
        const rewardId = this.sqidsService.decode(encodedId, SqidsPrefix.TIER_REWARD);
        if (!rewardId) throw new Error('Invalid reward ID');

        await this.claimRewardService.execute(user.id, rewardId);
    }
}
