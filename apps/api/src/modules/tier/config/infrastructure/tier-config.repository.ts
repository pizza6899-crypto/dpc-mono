import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierConfig } from '../domain/tier-config.entity';
import {
  TierConfigRepositoryPort,
  UpdateTierConfigProps,
} from './tier-config.repository.port';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

@Injectable()
export class TierConfigRepository implements TierConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cacheService: CacheService,
  ) { }

  async find(): Promise<TierConfig | null> {
    const record = await this.cacheService.getOrSet(
      CACHE_CONFIG.TIER.SETTINGS,
      async () => {
        return await this.tx.tierConfig.findUnique({
          where: { id: TierConfig.SINGLETON_ID },
        });
      },
    );

    return record ? TierConfig.fromPersistence(record) : null;
  }

  async update(props: UpdateTierConfigProps): Promise<TierConfig> {
    const updated = await this.tx.tierConfig.update({
      where: { id: TierConfig.SINGLETON_ID },
      data: {
        isUpgradeEnabled: props.isUpgradeEnabled,
        isDowngradeEnabled: props.isDowngradeEnabled,
        isBonusEnabled: props.isBonusEnabled,
        defaultDowngradeGracePeriodDays: props.defaultDowngradeGracePeriodDays,
        defaultRewardExpiryDays: props.defaultRewardExpiryDays,
        expGrantRollingUsd: props.expGrantRollingUsd,
        updatedBy: props.updatedBy,
      },
    });

    const updatedConfig = TierConfig.fromPersistence(updated);
    await this.cacheService.set(CACHE_CONFIG.TIER.SETTINGS, updatedConfig);

    return updatedConfig;
  }
}
