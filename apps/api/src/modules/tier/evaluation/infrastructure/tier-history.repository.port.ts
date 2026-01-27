
import { TierHistory } from '@prisma/client';

export interface CreateTierHistoryProps {
    userId: bigint;
    fromTierId: bigint | null;
    toTierId: bigint;
    changeType: 'UPGRADE' | 'DOWNGRADE' | 'MANUAL' | 'INITIAL';
    reason?: string;

    // Snapshots
    rollingAmountSnap: number; // Decimal 처리 주의
    compRateSnap: number;
    lossbackRateSnap: number;
    rakebackRateSnap: number;

    requirementUsdSnap: number;
    requirementDepositUsdSnap: number;
    cumulativeDepositUsdSnap: number;

    bonusAmount?: number;
    skippedBonusAmount?: number;
    skippedReason?: string;

    changeBy?: string;
    referenceType?: 'ADMIN_LOG' | 'EVALUATION_LOG';
    referenceId?: bigint;
}

export abstract class TierHistoryRepositoryPort {
    abstract save(history: CreateTierHistoryProps): Promise<TierHistory>;
}
