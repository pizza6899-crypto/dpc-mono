import { Controller, Post, Param, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiStandardResponse, ApiPaginatedResponse, ApiStandardErrors } from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { User } from 'src/modules/user/profile/domain/model/user.entity';
import { ClaimRewardService } from '../../application/claim-reward.service';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { GetUserRewardsService } from '../../application/get-user-rewards.service';
import { GetUserRewardsRequestDto } from './dto/request/get-user-rewards.request.dto';
import { UserRewardResponseDto } from './dto/response/user-reward.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';

export class ClaimRewardResponseDto { }

@ApiTags('User Reward')
@Controller('rewards')
@ApiBearerAuth()
@ApiStandardErrors()
export class RewardController {
    constructor(
        private readonly claimRewardService: ClaimRewardService,
        private readonly userRewardsService: GetUserRewardsService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get user rewards / 내 보상 목록 조회',
        description: '내가 지급받은 보상 목록을 조회합니다. (최신순 등 정렬 및 상태 필터 지원)',
    })
    @ApiPaginatedResponse(UserRewardResponseDto)
    async getRewards(
        @Query() query: GetUserRewardsRequestDto,
        @CurrentUser() user: User,
    ): Promise<PaginatedData<UserRewardResponseDto>> {
        const result = await this.userRewardsService.execute({
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            status: query.status,
            currency: query.currency,
            userId: user.id
        });

        const mappedData: UserRewardResponseDto[] = result.data.map((item) => ({
            id: this.sqidsService.encode(item.id, SqidsPrefix.REWARD),
            sourceType: item.sourceType,
            rewardType: item.rewardType,
            currency: item.currency,
            amount: item.amount.toString(),
            wageringTargetType: item.wageringTargetType,
            wageringMultiplier: item.wageringMultiplier?.toString() ?? null,
            wageringExpiryDays: item.wageringExpiryDays,
            status: item.status,
            expiresAt: item.expiresAt,
            claimedAt: item.claimedAt,
            createdAt: item.createdAt,
        }));

        return {
            data: mappedData,
            page: result.page,
            limit: result.limit,
            total: result.total,
        };
    }

    @Post(':id/claim')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Claim a reward / 보상 수령',
        description: '대기 중인 보상을 수령합니다.',
    })
    @ApiParam({ name: 'id', description: 'Sqids encoded reward ID' })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'USER',
        action: 'CLAIM_REWARD',
        extractMetadata: (req: any, args) => ({
            userId: req.user?.id?.toString(), // req.user 객체에서 직접 추출하여 TypeError 방지
            rewardId: args[0], // sqid
        }),
    })
    @ApiStandardResponse(ClaimRewardResponseDto, { status: HttpStatus.OK, description: '클레임 성공 / Successfully claimed' })
    async claimReward(
        @Param('id') encodedId: string,
        @CurrentUser() user: User,
    ): Promise<ClaimRewardResponseDto> {
        const defaultRewardId = this.sqidsService.decode(encodedId, SqidsPrefix.REWARD);
        await this.claimRewardService.execute({
            userId: user.id,
            rewardId: defaultRewardId,
        });

        return {};
    }
}
