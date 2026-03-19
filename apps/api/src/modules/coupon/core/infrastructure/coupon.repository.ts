import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CouponStatus } from '@prisma/client';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { Coupon } from '../domain/coupon.entity';
import { CouponMapper, PrismaCouponWithRewards } from './coupon.mapper';
import { CouponRepositoryPort } from '../ports/coupon.repository.port';

@Injectable()
export class CouponRepository implements CouponRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async findById(id: bigint): Promise<Coupon | null> {
    const prismaCoupon = await this.tx.coupon.findUnique({
      where: { id },
      include: { rewards: true },
    });

    if (!prismaCoupon) return null;

    return CouponMapper.toDomain(prismaCoupon as PrismaCouponWithRewards);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const prismaCoupon = await this.tx.coupon.findUnique({
      where: { code },
      include: { rewards: true },
    });

    if (!prismaCoupon) return null;

    return CouponMapper.toDomain(prismaCoupon as PrismaCouponWithRewards);
  }

  async save(coupon: Coupon): Promise<Coupon> {
    const data = CouponMapper.toPrisma(coupon);
    const rewards = CouponMapper.toPrismaRewards(coupon);

    let prismaCoupon: PrismaCouponWithRewards;

    if (coupon.id === 0n) {
      // 신규 생성
      prismaCoupon = (await this.tx.coupon.create({
        data: {
          ...data,
          rewards: {
            create: rewards,
          },
        },
        include: { rewards: true },
      })) as PrismaCouponWithRewards;
    } else {
      // 기존 수정
      prismaCoupon = (await this.tx.coupon.update({
        where: { id: coupon.id },
        data: {
          ...data,
          rewards: {
            deleteMany: {}, // 보상 정보는 단순화를 위해 전체 삭제 후 재생성
            create: rewards,
          },
        },
        include: { rewards: true },
      })) as PrismaCouponWithRewards;
    }

    return CouponMapper.toDomain(prismaCoupon);
  }

  async isUserInAllowlist(couponId: bigint, userId: bigint): Promise<boolean> {
    const allowlist = await this.tx.couponAllowlist.findUnique({
      where: {
        couponId_userId: {
          couponId,
          userId,
        },
      },
    });
    return !!allowlist;
  }

  async findMany(params: {
    id?: bigint;
    code?: string;
    status?: CouponStatus;
    startsAfter?: Date;
    expiresBefore?: Date;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<PaginatedData<Coupon>> {
    const {
      id,
      code,
      status,
      startsAfter,
      expiresBefore,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;

    const where: any = {};
    if (id) where.id = id;
    if (code) where.code = code;
    if (status) where.status = status;
    if (startsAfter) where.startsAt = { gte: startsAfter };
    if (expiresBefore) where.expiresAt = { lte: expiresBefore };

    const [total, prismaCoupons] = await Promise.all([
      this.tx.coupon.count({ where }),
      this.tx.coupon.findMany({
        where,
        include: { rewards: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      data: prismaCoupons.map((c) =>
        CouponMapper.toDomain(c as PrismaCouponWithRewards),
      ),
      total,
      page,
      limit,
    };
  }

  async findAll(): Promise<Coupon[]> {
    const prismaCoupons = await this.tx.coupon.findMany({
      include: { rewards: true },
      orderBy: { createdAt: 'desc' },
    });

    return prismaCoupons.map((c) =>
      CouponMapper.toDomain(c as PrismaCouponWithRewards),
    );
  }
}
