import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierSettings } from '../domain/tier-settings.entity';
import { TierSettingsRepositoryPort, UpdateTierSettingsProps } from './master.repository.port';

@Injectable()
export class TierSettingsRepository implements TierSettingsRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async find(): Promise<TierSettings | null> {
        // 싱글톤 ID로 유일한 레코드 조회
        const record = await this.tx.tierConfig.findUnique({
            where: { id: TierSettings.SINGLETON_ID }
        });
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
        return TierSettings.fromPersistence(updated);
    }
}
