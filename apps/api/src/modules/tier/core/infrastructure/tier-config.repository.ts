import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { TierConfig } from '../../domain/tier-config.entity';
import { TierConfigRepositoryPort } from './tier-config.repository.port';

@Injectable()
export class TierConfigRepository implements TierConfigRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async find(): Promise<TierConfig | null> {
        const record = await this.prisma.tierConfig.findFirst();
        return record ? TierConfig.fromPersistence(record) : null;
    }

    async save(config: TierConfig): Promise<TierConfig> {
        const data = {
            isPromotionEnabled: config.isPromotionEnabled,
            isDowngradeEnabled: config.isDowngradeEnabled,
            evaluationHourUtc: config.evaluationHourUtc,
            updatedBy: config.updatedBy,
        };

        // Assuming we always update the first record or create one if not existing
        // Check if ID exists, or just use findFirst logic since usually there is only one config

        // For simplicity, we assume ID is handled or we use upsert on a known ID if we enforce ID=1
        // But since it's BigInt auto-increment, let's just find first and update, or create.
        const existing = await this.prisma.tierConfig.findFirst();

        let record;
        if (existing) {
            record = await this.prisma.tierConfig.update({
                where: { id: existing.id },
                data,
            })
        } else {
            record = await this.prisma.tierConfig.create({
                data,
            })
        }

        return TierConfig.fromPersistence(record);
    }
}
