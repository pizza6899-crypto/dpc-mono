import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { GetAdminRewardsRequestDto } from '../controllers/admin/dto/request/get-admin-rewards.request.dto';
import { AdminRewardResponseDto } from '../controllers/admin/dto/response/reward.response.dto';

@Injectable()
export class GetAdminRewardsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async execute(query: GetAdminRewardsRequestDto): Promise<PaginatedData<AdminRewardResponseDto>> {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, userId, sourceType, rewardType } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(status ? { status } : {}),
            ...(userId ? { userId: BigInt(userId) } : {}),
            ...(sourceType ? { sourceType } : {}),
            ...(rewardType ? { rewardType } : {}),
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

        const mappedData: AdminRewardResponseDto[] = items.map((item) => ({
            id: item.id.toString(),
            userId: item.userId.toString(),
            sourceType: item.sourceType,
            sourceId: item.sourceId?.toString() ?? null,
            rewardType: item.rewardType,
            currency: item.currency,
            amount: item.amount.toString(),
            wageringTargetType: item.wageringTargetType,
            wageringMultiplier: item.wageringMultiplier?.toString() ?? null,
            wageringExpiryDays: item.wageringExpiryDays,
            maxCashConversion: item.maxCashConversion?.toString() ?? null,
            isForfeitable: item.isForfeitable,
            status: item.status,
            expiresAt: item.expiresAt,
            claimedAt: item.claimedAt,
            metadata: item.metadata,
            reason: item.reason,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        return {
            data: mappedData,
            page,
            limit,
            total,
        };
    }
}
