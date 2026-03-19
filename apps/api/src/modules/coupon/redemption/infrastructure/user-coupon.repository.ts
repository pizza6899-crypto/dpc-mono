import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserCouponRepositoryPort } from '../ports/user-coupon.repository.port';

@Injectable()
export class PrismaUserCouponRepository implements UserCouponRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async countUserCouponUsage(userId: bigint, couponId: bigint): Promise<number> {
    return this.tx.userCoupon.count({
      where: {
        userId,
        couponId,
      },
    });
  }

  async recordUsage(params: {
    id: bigint;
    userId: bigint;
    couponId: bigint;
    usedAt: Date;
  }): Promise<void> {
    await this.tx.userCoupon.create({
      data: {
        id: params.id,
        userId: params.userId,
        couponId: params.couponId,
        usedAt: params.usedAt,
      },
    });
  }
}
