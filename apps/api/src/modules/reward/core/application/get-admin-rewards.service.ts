import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserReward as PrismaUserReward } from '@prisma/client';
import { PaginatedResult } from './get-user-rewards.service';

export interface GetAdminRewardsQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: any;
    userId?: string;
    sourceType?: any;
    rewardType?: any;
    currency?: any;
}

@Injectable()
export class GetAdminRewardsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async execute(query: GetAdminRewardsQuery): Promise<PaginatedResult<PrismaUserReward>> {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, userId, sourceType, rewardType, currency } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(status ? { status } : {}),
            ...(userId ? { userId: BigInt(userId) } : {}),
            ...(sourceType ? { sourceType } : {}),
            ...(rewardType ? { rewardType } : {}),
            ...(currency ? { currency } : {}),
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

        return {
            data: items,
            page,
            limit,
            total,
        };
    }
}
