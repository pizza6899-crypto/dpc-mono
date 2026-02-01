import { Prisma, TierUpgradeRewardStatus, ExchangeCurrencyCode } from '@prisma/client';
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

        // Claim Snapshots
        public claimedCurrency: ExchangeCurrencyCode | null,
        public exchangeRate: Prisma.Decimal | null,
        public claimedAmount: Prisma.Decimal | null,

        public walletTxId: bigint | null,
        public referenceId: bigint | null,
        public tierHistoryId: bigint | null,

        public readonly tier?: Tier,
    ) { }

    // 상태 확인 헬퍼
    get isPending(): boolean {
        return this.status === TierUpgradeRewardStatus.PENDING;
    }

    // 만료 여부 확인 헬퍼
    get isExpired(): boolean {
        return this.expiresAt !== null && this.expiresAt < new Date();
    }

    claim(props: {
        walletTxId: bigint;
        currency: ExchangeCurrencyCode;
        amount: Prisma.Decimal;
        rate: Prisma.Decimal;
    }): void {
        if (!this.isPending) {
            throw new RewardNotPendingException(this.status);
        }
        if (this.isExpired) {
            throw new RewardExpiredException();
        }

        this.status = TierUpgradeRewardStatus.CLAIMED;
        this.claimedAt = new Date();
        this.walletTxId = props.walletTxId;
        this.claimedCurrency = props.currency;
        this.claimedAmount = props.amount;
        this.exchangeRate = props.rate;
    }

    cancel(reason: string): void {
        if (!this.isPending) {
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
            data.claimedCurrency,
            Cast.decimal(data.exchangeRate),
            Cast.decimal(data.claimedAmount),
            Cast.bigint(data.walletTxId),
            Cast.bigint(data.referenceId),
            Cast.bigint(data.tierHistoryId),
            data.tier ? Tier.fromPersistence(data.tier) : undefined,
        );
    }
}
