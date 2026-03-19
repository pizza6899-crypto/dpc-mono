// src/modules/promotion/config/domain/promotion-config.entity.ts
import { Prisma } from '@prisma/client';

export class PromotionConfig {
  public static readonly SINGLETON_ID = 1n;

  constructor(
    public readonly id: bigint,
    public readonly defaultAmlDepositMultiplier: Prisma.Decimal,
    public readonly defaultBonusExpiryDays: number,
    public readonly isPromotionEnabled: boolean,
    public readonly updatedAt: Date,
    public readonly updatedBy: bigint | null,
  ) {}
}
