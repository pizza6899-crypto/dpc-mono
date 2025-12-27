// src/modules/affiliate/referral/infrastructure/referral.mapper.ts
import { Injectable } from '@nestjs/common';
import { Referral } from '../domain';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지
 */
@Injectable()
export class ReferralMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: {
    id: string;
    affiliateId: string;
    codeId: string;
    subUserId: string;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Referral {
    return Referral.fromPersistence({
      id: prismaModel.id,
      affiliateId: prismaModel.affiliateId,
      codeId: prismaModel.codeId,
      subUserId: prismaModel.subUserId,
      ipAddress: prismaModel.ipAddress,
      deviceFingerprint: prismaModel.deviceFingerprint,
      userAgent: prismaModel.userAgent,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: Referral): {
    id: string;
    affiliateId: string;
    codeId: string;
    subUserId: string;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      id: persistence.id,
      affiliateId: persistence.affiliateId,
      codeId: persistence.codeId,
      subUserId: persistence.subUserId,
      ipAddress: persistence.ipAddress,
      deviceFingerprint: persistence.deviceFingerprint,
      userAgent: persistence.userAgent,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    };
  }
}
