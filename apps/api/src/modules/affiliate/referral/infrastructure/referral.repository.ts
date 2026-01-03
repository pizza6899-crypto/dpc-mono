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

  async countByAffiliateId(affiliateId: bigint): Promise<number> {
    return await this.tx.referral.count({
      where: { affiliateId },
    });
  }
}
