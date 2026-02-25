import type { TierConfig } from '../domain/tier-config.entity';

export interface UpdateTierConfigProps {
  isUpgradeEnabled?: boolean;
  isDowngradeEnabled?: boolean;
  isBonusEnabled?: boolean;
  defaultDowngradeGracePeriodDays?: number;
  defaultRewardExpiryDays?: number;
  updatedBy: bigint;
}

export abstract class TierConfigRepositoryPort {
  abstract find(): Promise<TierConfig | null>;
  abstract update(props: UpdateTierConfigProps): Promise<TierConfig>;
}
