import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon } from '../domain/coupon.entity';
import { CouponMapper } from './coupon.mapper';

@Injectable()
export class CouponRepository implements CouponRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async findById(id: bigint): Promise<Coupon | null> {
    const data = await this.tx.coupon.findUnique({
      where: { id },
      include: {
        rewards: true,
        allowlists: true,
      },
    });

    if (!data) return null;
    return CouponMapper.toDomain(data);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const data = await this.tx.coupon.findUnique({
      where: { code },
      include: {
        rewards: true,
        allowlists: true,
      },
    });

    if (!data) return null;
    return CouponMapper.toDomain(data);
  }

  async save(coupon: Coupon): Promise<void> {
    const data = CouponMapper.toPrisma(coupon);

    // [Aggregate Persistence Pattern]
    // Normally we use upsert for single entity, but for collections (rewards/allowlists)
    // we would need to sync them if they change. 
    // Here we focus on the basic Coupon persistence.
    await this.tx.coupon.upsert({
      where: { id: coupon.id },
      update: data,
      create: {
        ...data,
        id: coupon.id > 0n ? coupon.id : undefined,
      },
    });
  }

  async delete(id: bigint): Promise<void> {
    await this.tx.coupon.delete({
      where: { id },
    });
  }
}
