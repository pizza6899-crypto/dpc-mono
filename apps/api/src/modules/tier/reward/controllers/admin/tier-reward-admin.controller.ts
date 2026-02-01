import { Controller, Get, Post, Query, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { ApiPaginatedResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { GetRewardsQueryDto } from './dto/request/get-rewards-query.dto';
import { AdminTierRewardResponseDto } from './dto/response/admin-tier-reward.response.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { TierRewardRepositoryPort } from '../../infrastructure/tier-reward.repository.port';
import { CancelTierRewardRequestDto } from './dto/request/cancel-tier-reward.request.dto';
import { RewardNotFoundException } from '../../domain/tier-reward.exception';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@Controller('admin/tiers/rewards')
@ApiTags('Admin Tier Rewards')
@ApiStandardErrors()
@Admin()
export class TierRewardAdminController {
    constructor(
        private readonly rewardRepository: TierRewardRepositoryPort,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @Paginated()
    @ApiOperation({ summary: 'List tier rewards / 티어 보상 목록 조회' })
    @ApiPaginatedResponse(AdminTierRewardResponseDto)
    async list(@Query() query: GetRewardsQueryDto) {
        let userId: bigint | undefined;

        if (query.userId) {
            try {
                userId = BigInt(query.userId);
            } catch {
                return { data: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 20 };
            }
        }

        const { items, total } = await this.rewardRepository.findAll({
            ...query,
            userId,
            fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
            toDate: query.toDate ? new Date(query.toDate) : undefined,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        });

        return {
            data: items.map(r => ({
                id: r.id.toString(),
                userId: r.userId.toString(),
                tierName: r.tier?.getName(Language.EN) ?? '',
                fromLevel: r.fromLevel,
                toLevel: r.toLevel,
                amount: r.bonusAmountUsd.toFixed(2),
                wageringMultiplier: r.wageringMultiplier.toFixed(2),
                status: r.status,
                createdAt: r.createdAt,
                claimedAt: r.claimedAt,
                expiresAt: r.expiresAt,
                cancelledAt: r.cancelledAt,
                cancelReason: r.cancelReason,
            })),
            total,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        };
    }

    @Post(':id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel tier reward / 티어 보상 취소' })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'TIER',
        action: 'CANCEL_REWARD',
        extractMetadata: (req) => ({ rewardId: req.params.id, reason: req.body.reason })
    })
    async cancel(
        @Param('id') id: string,
        @Body() body: CancelTierRewardRequestDto,
    ) {
        let rewardId: bigint;
        try {
            rewardId = BigInt(id);
        } catch {
            throw new RewardNotFoundException();
        }

        const reward = await this.rewardRepository.findById(rewardId);

        if (!reward) {
            throw new RewardNotFoundException();
        }

        reward.cancel(body.reason);
        await this.rewardRepository.save(reward);
    }
}
