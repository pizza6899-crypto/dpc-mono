import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { TierChangeType, TierHistoryReferenceType } from '@prisma/client';
import { TierHistory } from '../domain/tier-history.entity';

export interface CreateTierHistoryProps {
    userId: bigint;
    fromTierId: bigint | null;
    toTierId: bigint;
    changeType: TierChangeType;
    reason?: string;
    rollingAmountSnap: number;
    compRateSnap: number;
    lossbackRateSnap: number;
    rakebackRateSnap: number;
    requirementUsdSnap: number;
    requirementDepositUsdSnap: number;
    cumulativeDepositUsdSnap: number;
    bonusAmount?: number;
    changeBy?: string;
    referenceType?: TierHistoryReferenceType;
    referenceId?: bigint;
}

export abstract class TierHistoryRepositoryPort {
    abstract save(props: CreateTierHistoryProps): Promise<TierHistory>;
}

@Injectable()
export class TierHistoryRepository implements TierHistoryRepositoryPort {
    constructor(
        private readonly prisma: PrismaService,
        private readonly snowflake: SnowflakeService,
    ) { }

    async save(props: CreateTierHistoryProps): Promise<TierHistory> {
        const id = this.snowflake.generate(new Date());

        const record = await this.prisma.tierHistory.create({
            data: {
                id,
                ...props,
                changeBy: props.changeBy || 'SYSTEM',
            }
        });

        return TierHistory.fromPersistence(record);
    }
}
