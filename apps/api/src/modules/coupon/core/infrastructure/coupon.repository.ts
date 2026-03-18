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

  async findAll(params: {
    code?: string;
    status?: string[];
    startsAt?: Date;
    expiresAt?: Date;
    skip?: number;
    take?: number;
  }): Promise<{ items: Coupon[]; total: number }> {
    const where: any = {};
    if (params.code) where.code = { contains: params.code };
    if (params.status && params.status.length > 0) where.status = { in: params.status };
    if (params.startsAt) where.startsAt = { gte: params.startsAt };
    if (params.expiresAt) where.expiresAt = { lte: params.expiresAt };

    const [items, total] = await Promise.all([
      this.tx.coupon.findMany({
        where,
        include: {
          rewards: true,
          allowlists: true,
        },
        skip: params.skip || 0,
        take: params.take || 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.tx.coupon.count({ where }),
    ]);

    return {
      items: items.map(CouponMapper.toDomain),
      total,
    };
  }

  async save(coupon: Coupon): Promise<void> {
    const data = CouponMapper.toPrisma(coupon);
    const rewardData = CouponMapper.toRewardCreateInput(coupon.rewards);
    const allowlistData = CouponMapper.toAllowlistCreateInput(coupon.allowlists);

    if (coupon.id === 0n) {
      await this.tx.coupon.create({
        data: {
          ...data,
          rewards: { createMany: { data: rewardData } },
          allowlists: { createMany: { data: allowlistData } },
        },
      });
    } else {
      await this.tx.coupon.update({
        where: { id: coupon.id },
        data: {
          ...data,
          rewards: {
            deleteMany: {},
            createMany: { data: rewardData },
          },
          allowlists: {
            deleteMany: {},
            createMany: { data: allowlistData },
          },
        },
      });
    }
  }

  async delete(id: bigint): Promise<void> {
    await this.tx.coupon.delete({
      where: { id },
    });
  }
}
