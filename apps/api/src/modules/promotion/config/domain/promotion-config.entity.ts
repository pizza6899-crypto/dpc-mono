// src/modules/promotion/config/domain/promotion-config.entity.ts
import { Prisma } from '@prisma/client';

export class PromotionConfig {
  public static readonly SINGLETON_ID = 1n;

  constructor(
    public readonly id: bigint,
    public readonly defaultAmlDepositMultiplier: Prisma.Decimal,
    public readonly isPromotionEnabled: boolean,
    public readonly updatedAt: Date,
    public readonly updatedBy: bigint | null,
  ) { }

  static createDefault(): PromotionConfig {
    return new PromotionConfig(
      this.SINGLETON_ID,
      new Prisma.Decimal(1.0),
      true,
      new Date(),
      null,
    );
  }
}
