import type { Prisma } from '@prisma/client';
import type { PersistenceOf } from 'src/infrastructure/persistence/persistence.util';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

export type TierConfigRawPayload = Prisma.TierConfigGetPayload<object>;

export class TierConfig {
  public static readonly SINGLETON_ID = 1n;

  constructor(
    public readonly isUpgradeEnabled: boolean,
    public readonly isDowngradeEnabled: boolean,
    public readonly isBonusEnabled: boolean,
    public readonly defaultDowngradeGracePeriodDays: number,
    public readonly defaultRewardExpiryDays: number,
    public readonly updatedAt: Date,
    public readonly updatedBy: bigint | null,
  ) {}

  static fromPersistence(
    data: PersistenceOf<TierConfigRawPayload>,
  ): TierConfig {
    return new TierConfig(
      data.isUpgradeEnabled,
      data.isDowngradeEnabled,
      data.isBonusEnabled,
      data.defaultDowngradeGracePeriodDays,
      data.defaultRewardExpiryDays,
      Cast.date(data.updatedAt),
      Cast.bigint(data.updatedBy),
    );
  }
}
