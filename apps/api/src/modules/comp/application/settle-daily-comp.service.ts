import { Injectable, Logger, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, RewardItemType, RewardSourceType, CompTransactionType } from '@prisma/client';
import {
    COMP_DAILY_SETTLEMENT_REPOSITORY,
    COMP_CONFIG_REPOSITORY,
    COMP_REPOSITORY,
} from '../ports/repository.token';
import type {
    CompDailySettlementRepositoryPort,
    CompConfigRepositoryPort,
    CompRepositoryPort,
} from '../ports';
import { CompPolicy, CompPolicyViolationException, CompAccountTransaction } from '../domain';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { GrantRewardService } from 'src/modules/reward/core/application/grant-reward.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class SettleDailyCompService {
    private readonly logger = new Logger(SettleDailyCompService.name);

    constructor(
        @Inject(COMP_DAILY_SETTLEMENT_REPOSITORY)
        private readonly compDailySettlementRepository: CompDailySettlementRepositoryPort,
        @Inject(COMP_CONFIG_REPOSITORY)
        private readonly compConfigRepository: CompConfigRepositoryPort,
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
        private readonly grantRewardService: GrantRewardService,
        private readonly compPolicy: CompPolicy,
        private readonly advisoryLockService: AdvisoryLockService,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    async getPendingSettlements() {
        return this.compDailySettlementRepository.findPendingSettlements();
    }

    @Transactional()
    async processSingleSettlement(pending: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        totalEarned: Prisma.Decimal;
    }): Promise<void> {
        const { userId, currency, totalEarned } = pending;

        await this.advisoryLockService.acquireLock(
            LockNamespace.COMP_ACCOUNT,
            userId.toString(),
            {
                throwThrottleError: true,
            },
        );

        const config = await this.compConfigRepository.getConfig(currency);
        const account = await this.compRepository.findByUserIdAndCurrency(
            userId,
            currency,
        );

        if (!account) {
            this.logger.warn(`Comp settlement skipped for user ${userId}: Account not found.`);
            await this.compDailySettlementRepository.updateStatuses(userId, currency, 'SKIPPED');
            return;
        }

        // Checking settlement policy (Minimum amount, frozen status, etc)
        try {
            this.compPolicy.verifySettlement(config, account, totalEarned);
        } catch (error) {
            if (error instanceof CompPolicyViolationException) {
                this.logger.warn(`Comp settlement skipped for user ${userId}: ${error.message}`);
                // Optionally update the status to SKIPPED if it doesn't meet minimum limit today to retry next day?
                // Wait, if it's less than minimum, we just leave it as UNSETTLED so it gets added up later?
                // Actually, daily settlement rows are created each day. If it's left UNSETTLED, next day's run will aggregate it natively (groupBy sums totalEarned of all UNSETTLED).
                // Let's leave it as UNSETTLED, it will simply be ignored or accumulated tomorrow.
                return;
            }
            throw error;
        }

        // It passed verification, grant reward as CASH
        const reward = await this.grantRewardService.execute({
            userId,
            sourceType: RewardSourceType.COMP_REWARD,
            rewardType: RewardItemType.BONUS_MONEY, // Convert Comp to CASH / BONUS_MONEY
            currency,
            amount: totalEarned,
            reason: 'Daily Comp Settlement',
            wageringMultiplier: new Prisma.Decimal(0), // No wagering required, it effectively becomes withdrawable cash immediately.
        });

        // Update daily settlement statuses
        await this.compDailySettlementRepository.updateStatuses(userId, currency, 'PROCESSED', reward.id);

        // Record the usage in the comp account tracking
        const settledAccount = account.settle(totalEarned);
        await this.compRepository.save(settledAccount);

        // Record the transaction log (Negative amount for usage/settlement)
        const transaction = CompAccountTransaction.create({
            id: this.snowflakeService.generate().id,
            compAccountId: settledAccount.id,
            amount: totalEarned.negated(),
            type: CompTransactionType.SETTLEMENT,
            referenceId: reward.id, // Reference the granted reward
            description: 'Daily Comp Settlement',
        });
        await this.compRepository.createTransaction(transaction);

        this.logger.log(`Comp Settlement Processed: user=${userId}, amount=${totalEarned}, rewardId=${reward.id}`);
    }
}
