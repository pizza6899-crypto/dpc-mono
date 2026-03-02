import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserReward as PrismaUserReward } from '@prisma/client';

export interface GetUserRewardsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: any;
  currency?: any;
  userId: bigint;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class GetUserRewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetUserRewardsQuery,
  ): Promise<PaginatedResult<PrismaUserReward>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      currency,
      userId,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status ? { status } : {}),
      ...(currency && currency.length > 0
        ? { currency: { in: currency } }
        : {}),
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
