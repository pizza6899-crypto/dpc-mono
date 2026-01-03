// src/modules/affiliate/code/infrastructure/affiliate-code.mapper.ts
import { Injectable } from '@nestjs/common';
import { AffiliateCode } from '../domain';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지
 */
@Injectable()
export class AffiliateCodeMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: {
    id: bigint;
    uid: string;
    userId: bigint;
    code: string;
    campaignName: string | null;
    isActive: boolean;
    isDefault: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
  }): AffiliateCode {
    return AffiliateCode.fromPersistence({
      id: prismaModel.id,
      uid: prismaModel.uid,
      userId: prismaModel.userId,
      code: prismaModel.code,
      campaignName: prismaModel.campaignName,
      isActive: prismaModel.isActive,
      isDefault: prismaModel.isDefault,
      expiresAt: prismaModel.expiresAt,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      lastUsedAt: prismaModel.lastUsedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: AffiliateCode): {
    id: bigint | null;
    uid: string;
    userId: bigint;
    code: string;
    campaignName: string | null;
    isActive: boolean;
    isDefault: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
  } {
    const persistence = domain.toPersistence();
    return {
      id: persistence.id,
      uid: persistence.uid,
      userId: persistence.userId,
      code: persistence.code,
      campaignName: persistence.campaignName,
      isActive: persistence.isActive,
      isDefault: persistence.isDefault,
      expiresAt: persistence.expiresAt,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
      lastUsedAt: persistence.lastUsedAt,
    };
  }
}
