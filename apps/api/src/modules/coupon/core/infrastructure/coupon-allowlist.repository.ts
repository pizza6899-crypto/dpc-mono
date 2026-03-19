import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { CouponAllowlistRepositoryPort } from '../ports/coupon-allowlist.repository.port';

@Injectable()
export class PrismaCouponAllowlistRepository implements CouponAllowlistRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async findMany(params: {
    couponId: bigint;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<PaginatedData<{ userId: bigint; createdAt: Date }>> {
    const { couponId, page, limit, sortBy, sortOrder } = params;

    const skip = (page - 1) * limit;

    const where = { couponId };

    const [total, items] = await Promise.all([
      this.tx.couponAllowlist.count({ where }),
      this.tx.couponAllowlist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: { userId: true, createdAt: true },
      }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
    };
  }

  async addMany(couponId: bigint, userIds: bigint[]): Promise<void> {
    await this.tx.couponAllowlist.createMany({
      data: userIds.map((userId) => ({
        couponId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  async remove(couponId: bigint, userId: bigint): Promise<void> {
    await this.tx.couponAllowlist.deleteMany({
      where: {
        couponId,
        userId,
      },
    });
  }

  async clear(couponId: bigint): Promise<void> {
    await this.tx.couponAllowlist.deleteMany({
      where: {
        couponId,
      },
    });
  }
}
