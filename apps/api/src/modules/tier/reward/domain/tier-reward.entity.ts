import { Prisma, TierUpgradeRewardStatus } from '@prisma/client';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';
import { Tier } from '../../definitions/domain/tier.entity';
import { RewardExpiredException, RewardNotPendingException } from './tier-reward.exception';

export type TierRewardRawPayload = Prisma.TierUpgradeRewardGetPayload<{ include: { tier: { include: { translations: true } } } }>;

export class TierReward {
    constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly tierId: bigint,

        public readonly fromLevel: number,
        public readonly toLevel: number,

        public readonly bonusAmountUsd: Prisma.Decimal,
        public readonly wageringMultiplier: Prisma.Decimal,

        public status: TierUpgradeRewardStatus,
        public readonly createdAt: Date,
        public claimedAt: Date | null,
        public expiresAt: Date | null,

        public cancelledAt: Date | null,
        public cancelReason: string | null,

        public walletTxId: bigint | null,
        public referenceId: bigint | null,
        public tierHistoryId: bigint | null,

        public readonly tier?: Tier,
    ) { }

    claim(walletTxId: bigint): void {
        if (this.status !== TierUpgradeRewardStatus.PENDING) {
            throw new RewardNotPendingException(this.status);
        }
        if (this.expiresAt && this.expiresAt < new Date()) {
            throw new RewardExpiredException();
        }

        this.status = TierUpgradeRewardStatus.CLAIMED;
        this.claimedAt = new Date();
        this.walletTxId = walletTxId;
    }

    cancel(reason: string): void {
        if (this.status !== TierUpgradeRewardStatus.PENDING) {
            throw new RewardNotPendingException(this.status);
        }
        this.status = TierUpgradeRewardStatus.CANCELLED;
        this.cancelledAt = new Date();
        this.cancelReason = reason;
    }

    static fromPersistence(data: PersistenceOf<TierRewardRawPayload>): TierReward {
        return new TierReward(
            Cast.bigint(data.id),
            Cast.bigint(data.userId),
            Cast.bigint(data.tierId),
            data.fromLevel,
            data.toLevel,
            Cast.decimal(data.bonusAmountUsd),
            Cast.decimal(data.wageringMultiplier),
            data.status,
            Cast.date(data.createdAt),
            Cast.date(data.claimedAt),
            Cast.date(data.expiresAt),
            Cast.date(data.cancelledAt),
            data.cancelReason,
            Cast.bigint(data.walletTxId),
            Cast.bigint(data.referenceId),
            Cast.bigint(data.tierHistoryId),
            data.tier ? Tier.fromPersistence(data.tier) : undefined,
        );
    }
}
