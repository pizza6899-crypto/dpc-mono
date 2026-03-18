import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserCouponRepositoryPort } from '../ports/user-coupon.repository.port';
import { UserCoupon } from '../domain/user-coupon.entity';
import { UserCouponMapper } from './user-coupon.mapper';

@Injectable()
export class UserCouponRepository implements UserCouponRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async findById(id: bigint): Promise<UserCoupon | null> {
    const data = await this.tx.userCoupon.findUnique({
      where: { id },
    });

    if (!data) return null;
    return UserCouponMapper.toDomain(data);
  }

  async findByUserIdAndCouponId(userId: bigint, couponId: bigint): Promise<UserCoupon | null> {
    const data = await this.tx.userCoupon.findFirst({
      where: { userId, couponId },
    });

    if (!data) return null;
    return UserCouponMapper.toDomain(data);
  }

  async countByUserIdAndCouponId(userId: bigint, couponId: bigint): Promise<number> {
    return await this.tx.userCoupon.count({
      where: { userId, couponId },
    });
  }

  async save(userCoupon: UserCoupon): Promise<void> {
    const data = UserCouponMapper.toPersistence(userCoupon);

    await this.tx.userCoupon.upsert({
      where: { id: userCoupon.id },
      update: data,
      create: data,
    });
  }
}
