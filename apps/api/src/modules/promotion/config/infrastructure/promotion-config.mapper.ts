// src/modules/promotion/config/infrastructure/promotion-config.mapper.ts
import { Injectable } from '@nestjs/common';
import { PromotionConfig as PrismaPromotionConfig } from '@prisma/client';
import { PromotionConfig } from '../domain/promotion-config.entity';

@Injectable()
export class PromotionConfigMapper {
  toDomain(prismaConfig: PrismaPromotionConfig): PromotionConfig {
    return new PromotionConfig(
      BigInt(prismaConfig.id),
      prismaConfig.defaultAmlDepositMultiplier,
      prismaConfig.isPromotionEnabled,
      prismaConfig.updatedAt,
      prismaConfig.updatedBy,
    );
  }

  toPrismaUpdate(config: PromotionConfig): any {
    return {
      defaultAmlDepositMultiplier: config.defaultAmlDepositMultiplier,
      isPromotionEnabled: config.isPromotionEnabled,
      updatedBy: config.updatedBy,
    };
  }
}
