import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierConfig } from '../domain/tier-config.entity';
import { TierConfigRepositoryPort, UpdateTierConfigProps } from './master.repository.port';

@Injectable()
export class TierConfigRepository implements TierConfigRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async find(): Promise<TierConfig | null> {
        const record = await this.tx.tierConfig.findFirst({
            orderBy: { id: 'desc' } // 항상 최신 레코드 (ID 기준 or UpdatedAt 기준)
        });
        return record ? TierConfig.fromPersistence(record) : null;
    }

    async update(props: UpdateTierConfigProps): Promise<TierConfig> {
        // 기존 설정 조회 (항상 id=1 또는 단일 레코드를 가정)
        // 현재는 findFirst로 최신을 가져오거나, 없으면 생성하는 로직이 필요할 수 있음
        const existing = await this.tx.tierConfig.findFirst({
            orderBy: { id: 'asc' }
        });

        // 없으면 새로 생성 (id=1로 고정하여 단일 Row 패턴 유지 권장)
        if (!existing) {
            const created = await this.tx.tierConfig.create({
                data: {
                    isPromotionEnabled: props.isPromotionEnabled ?? true,
                    isDowngradeEnabled: props.isDowngradeEnabled ?? false,
                    evaluationHourUtc: props.evaluationHourUtc ?? 0,
                    updatedBy: props.updatedBy,
                }
            });
            return TierConfig.fromPersistence(created);
        }

        const updated = await this.tx.tierConfig.update({
            where: { id: existing.id },
            data: {
                isPromotionEnabled: props.isPromotionEnabled,
                isDowngradeEnabled: props.isDowngradeEnabled,
                evaluationHourUtc: props.evaluationHourUtc,
                updatedBy: props.updatedBy,
            }
        });
        return TierConfig.fromPersistence(updated);
    }
}
