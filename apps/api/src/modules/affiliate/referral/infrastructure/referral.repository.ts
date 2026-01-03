// src/modules/affiliate/referral/infrastructure/referral.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { createId } from '@paralleldrive/cuid2';
import { Referral, ReferralNotFoundException } from '../domain';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { ReferralMapper } from './referral.mapper';

@Injectable()
export class ReferralRepository implements ReferralRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: ReferralMapper,
  ) { }

  async create(params: {
    affiliateId: bigint;
    codeId: bigint;
    subUserId: bigint;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    userAgent?: string | null;
  }): Promise<Referral> {
    const uid = createId();

    const result = await this.tx.referral.create({
      data: {
        uid,
        affiliateId: params.affiliateId,
        codeId: params.codeId,
        subUserId: params.subUserId,
        ipAddress: params.ipAddress || null,
        deviceFingerprint: params.deviceFingerprint || null,
        userAgent: params.userAgent || null,
      },
    });

    return this.mapper.toDomain(result);
  }

  async findByUid(uid: string): Promise<Referral | null> {
    const result = await this.tx.referral.findUnique({
      where: { uid },
    });

    if (!result) {
      return null;
    }

    return this.mapper.toDomain(result);
  }

  async getByUid(uid: string): Promise<Referral> {
    const referral = await this.findByUid(uid);
    if (!referral) {
      throw new ReferralNotFoundException(uid);
    }
    return referral;
  }

  async findByAffiliateId(affiliateId: bigint): Promise<Referral[]> {
    const results = await this.tx.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) => this.mapper.toDomain(result));
  }

  async findBySubUserId(subUserId: bigint): Promise<Referral | null> {
    const result = await this.tx.referral.findFirst({
      where: { subUserId },
    });

    if (!result) {
      return null;
    }

    return this.mapper.toDomain(result);
  }

  async findByCodeId(codeId: bigint): Promise<Referral[]> {
    const results = await this.tx.referral.findMany({
      where: { codeId },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) => this.mapper.toDomain(result));
  }

  async findByAffiliateAndSubUser(
    affiliateId: bigint,
    subUserId: bigint,
  ): Promise<Referral | null> {
    const result = await this.tx.referral.findUnique({
      where: {
        affiliateId_subUserId: {
          affiliateId,
          subUserId,
        },
      },
    });

    if (!result) {
      return null;
    }
    return this.mapper.toDomain(result);
  }

  async findManyForAdmin(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt';
    sortOrder?: 'asc' | 'desc';
    affiliateId?: bigint;
    subUserId?: bigint;
    codeId?: bigint;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    referrals: Array<Referral & {
      affiliateEmail: string;
      subUserEmail: string;
      codeValue: string;
      campaignName?: string | null;
    }>;
    total: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      affiliateId,
      subUserId,
      codeId,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(affiliateId && { affiliateId }),
      ...(subUserId && { subUserId }),
      ...(codeId && { codeId }),
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [results, total] = await Promise.all([
      this.tx.referral.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          affiliate: { select: { email: true } },
          subUser: { select: { email: true } },
          code: { select: { code: true, campaignName: true } },
        },
      }),
      this.tx.referral.count({ where }),
    ]);

    const referrals = results.map((result) => {
      const domain = this.mapper.toDomain(result);
      return Object.assign(domain, {
        affiliateEmail: result.affiliate.email,
        subUserEmail: result.subUser.email,
        codeValue: result.code.code,
        campaignName: result.code.campaignName,
      });
    });

    return { referrals, total };
  }
  async countByAffiliateId(affiliateId: bigint): Promise<number> {
    return this.tx.referral.count({
      where: { affiliateId },
    });
  }

  async findByIdForAdmin(id: bigint): Promise<(Referral & {
    affiliateEmail: string;
    subUserEmail: string;
    codeValue: string;
    campaignName?: string | null;
  }) | null> {
    const result = await this.tx.referral.findUnique({
      where: { id },
      include: {
        affiliate: { select: { email: true } },
        subUser: { select: { email: true } },
        code: { select: { code: true, campaignName: true } },
      },
    });

    if (!result) return null;

    const domain = this.mapper.toDomain(result);
    return Object.assign(domain, {
      affiliateEmail: result.affiliate.email,
      subUserEmail: result.subUser.email,
      codeValue: result.code.code,
      campaignName: result.code.campaignName,
    });
  }
}
