import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierDemotionWarning } from '../domain/tier-demotion-warning.entity';
import { TierDemotionWarningRepositoryPort, CreateTierDemotionWarningProps } from './evaluator.repository.port';

@Injectable()
export class TierDemotionWarningRepository implements TierDemotionWarningRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findByUserId(userId: bigint): Promise<TierDemotionWarning | null> {
        const record = await this.tx.tierDemotionWarning.findUnique({
            where: { userId },
        });
        return record ? TierDemotionWarning.fromPersistence(record) : null;
    }

    async save(warning: TierDemotionWarning): Promise<TierDemotionWarning> {
        const data = {
            currentTierId: warning.currentTierId,
            targetTierId: warning.targetTierId,
            evaluationDueAt: warning.evaluationDueAt,
            requiredRolling: warning.requiredRolling,
            currentRolling: warning.currentRolling,
            lastNotifiedAt: warning.lastNotifiedAt,
        };

        const record = await this.tx.tierDemotionWarning.update({
            where: { id: warning.id },
            data,
        });

        return TierDemotionWarning.fromPersistence(record);
    }

    async create(props: CreateTierDemotionWarningProps): Promise<TierDemotionWarning> {
        const record = await this.tx.tierDemotionWarning.create({
            data: {
                userId: props.userId,
                currentTierId: props.currentTierId,
                targetTierId: props.targetTierId,
                evaluationDueAt: props.evaluationDueAt,
                requiredRolling: props.requiredRolling,
                currentRolling: props.currentRolling,
            },
        });

        return TierDemotionWarning.fromPersistence(record);
    }

    async deleteByUserId(userId: bigint): Promise<void> {
        await this.tx.tierDemotionWarning.deleteMany({
            where: { userId },
        });
    }

    async findAllExpired(now: Date): Promise<TierDemotionWarning[]> {
        const records = await this.tx.tierDemotionWarning.findMany({
            where: {
                evaluationDueAt: {
                    lte: now,
                },
            },
        });

        return records.map(TierDemotionWarning.fromPersistence);
    }
}
