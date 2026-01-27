
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SnowflakeService } from '../../../../../common/snowflake/snowflake.service';
import { TierHistoryRepositoryPort, CreateTierHistoryProps } from '../tier-history.repository.port';
import { TierChangeType, TierHistoryReferenceType, TierHistory } from '@prisma/client';

@Injectable()
export class TierHistoryRepository implements TierHistoryRepositoryPort {
    constructor(
        private readonly prisma: PrismaService,
        private readonly snowflake: SnowflakeService,
    ) { }

    async save(props: CreateTierHistoryProps): Promise<TierHistory> {
        const id = this.snowflake.generate(new Date());

        return this.prisma.tierHistory.create({
            data: {
                id,
                userId: props.userId,
                fromTierId: props.fromTierId,
                toTierId: props.toTierId,
                changeType: props.changeType as TierChangeType,
                reason: props.reason,

                rollingAmountSnap: props.rollingAmountSnap,
                compRateSnap: props.compRateSnap,
                lossbackRateSnap: props.lossbackRateSnap,
                rakebackRateSnap: props.rakebackRateSnap,

                requirementUsdSnap: props.requirementUsdSnap,
                requirementDepositUsdSnap: props.requirementDepositUsdSnap,
                cumulativeDepositUsdSnap: props.cumulativeDepositUsdSnap,

                bonusAmount: props.bonusAmount,
                skippedBonusAmount: props.skippedBonusAmount,
                skippedReason: props.skippedReason,

                changeBy: props.changeBy || 'SYSTEM',
                referenceType: props.referenceType as TierHistoryReferenceType,
                referenceId: props.referenceId,
            },
        });
    }
}
