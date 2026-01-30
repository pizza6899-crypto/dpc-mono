import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierSettings } from '../domain/tier-settings.entity';
import { TierSettingsRepositoryPort, UpdateTierSettingsProps } from './tier-settings.repository.port';

@Injectable()
export class TierSettingsRepository implements TierSettingsRepositoryPort {
    private cachedSettings: TierSettings | null = null;
    private lastFetched: number = 0;
    private readonly CACHE_TTL = 60 * 1000; // 1분

    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async find(): Promise<TierSettings | null> {
        const now = Date.now();
        if (this.cachedSettings && (now - this.lastFetched < this.CACHE_TTL)) {
            return this.cachedSettings;
        }

        // 싱글톤 ID로 유일한 레코드 조회
        const record = await this.tx.tierConfig.findUnique({
            where: { id: TierSettings.SINGLETON_ID }
        });

        if (!record) return null;

        const settings = TierSettings.fromPersistence(record);
        this.cachedSettings = settings;
        this.lastFetched = now;

        return settings;
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
        this.cachedSettings = updatedSettings;
        this.lastFetched = Date.now();

        return updatedSettings;
    }
}
