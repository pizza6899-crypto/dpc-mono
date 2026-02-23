import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { UserRewardResponseDto } from '../controllers/user/dto/response/user-reward.response.dto';
import { GetUserRewardsRequestDto } from '../controllers/user/dto/request/get-user-rewards.request.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@Injectable()
export class GetUserRewardsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly sqidsService: SqidsService
    ) { }

    async execute(userId: bigint, query: GetUserRewardsRequestDto): Promise<PaginatedData<UserRewardResponseDto>> {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status } = query;
        const skip = (page - 1) * limit;

        const where = {
            userId,
            ...(status ? { status } : {}),
        };

        const [items, total] = await Promise.all([
            this.prisma.userReward.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
            }),
            this.prisma.userReward.count({ where }),
        ]);

        const mappedData: UserRewardResponseDto[] = items.map((item) => ({
            id: this.sqidsService.encode(item.id, SqidsPrefix.REWARD),
            sourceType: item.sourceType,
            rewardType: item.rewardType,
            currency: item.currency,
            amount: item.amount.toString(),
            wageringTargetType: item.wageringTargetType,
            status: item.status,
            expiresAt: item.expiresAt,
            claimedAt: item.claimedAt,
            createdAt: item.createdAt,
        }));

        return {
            data: mappedData,
            page,
            limit,
            total,
        };
    }
}
