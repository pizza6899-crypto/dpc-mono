import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierSettings } from '../domain/tier-settings.entity';
import { TierSettingsRepositoryPort, UpdateTierSettingsProps } from './tier-settings.repository.port';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

@Injectable()
export class TierSettingsRepository implements TierSettingsRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly cacheService: CacheService,
    ) { }

    async find(): Promise<TierSettings | null> {
        const record = await this.cacheService.getOrSet(
            CACHE_CONFIG.TIER.SETTINGS,
            async () => {
                return await this.tx.tierConfig.findUnique({
                    where: { id: TierSettings.SINGLETON_ID }
                });
            }
        );

        return record ? TierSettings.fromPersistence(record) : null;
    }

    async update(props: UpdateTierSettingsProps): Promise<TierSettings> {
        const updated = await this.tx.tierConfig.update({
            where: { id: TierSettings.SINGLETON_ID },
            data: {
                isPromotionEnabled: props.isPromotionEnabled,
                isDowngradeEnabled: props.isDowngradeEnabled,
                evaluationHourUtc: props.evaluationHourUtc,
                // @ts-ignore: Prisma Client type sync lag (Schema is BigInt)
                updatedBy: props.updatedBy,
            }
        });

        const updatedSettings = TierSettings.fromPersistence(updated);
        await this.cacheService.set(CACHE_CONFIG.TIER.SETTINGS, updatedSettings);

        return updatedSettings;
    }
}
