import { Injectable, Logger, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, RewardItemType, RewardSourceType, CompTransactionType, CompSettlementStatus } from '@prisma/client';
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

    async getPendingSettlements(untilDate: Date) {
        return this.compDailySettlementRepository.findPendingSettlements(untilDate);
    }

    @Transactional()
    async processSingleSettlement(pending: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        totalEarned: Prisma.Decimal;
    }, untilDate: Date): Promise<void> {
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
            await this.compDailySettlementRepository.updateStatuses(userId, currency, CompSettlementStatus.SKIPPED, untilDate);
            return;
        }

        // Checking settlement policy (Minimum amount, frozen status, etc)
        try {
            this.compPolicy.verifySettlement(config, account, totalEarned);
        } catch (error) {
            if (error instanceof CompPolicyViolationException) {
                this.logger.warn(`Comp settlement skipped for user ${userId}: ${error.message}`);
                // 최소 한도 미달 시 다음 날 재시도를 위해 상태를 SKIPPED로 업데이트해야 할까요?
                // 아니면 최소 금액 미만일 경우 나중에 합산되도록 UNSETTLED 상태로 두는 것이 나을까요?
                // 매일 정산 데이터가 생성되므로, UNSETTLED 상태로 두면 다음 날 실행 시 자동으로 합산됩니다 (모든 UNSETTLED의 totalEarned를 합산).
                // 따라서 UNSETTLED 상태로 유지하여 내일 합산되도록 합니다.
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

        // Update daily settlement statuses up to untilDate
        await this.compDailySettlementRepository.updateStatuses(userId, currency, CompSettlementStatus.SETTLED, untilDate, reward.id);

        // Record the usage in the comp account tracking
        const settledAccount = account.settle(totalEarned);
        await this.compRepository.save(settledAccount);

        // Record the transaction log (Negative amount for usage/settlement)
        const sf = this.snowflakeService.generate();
        const transaction = CompAccountTransaction.create({
            id: sf.id,
            compAccountId: settledAccount.id,
            amount: totalEarned.negated(),
            type: CompTransactionType.SETTLEMENT,
            referenceId: reward.id, // Reference the granted reward
            description: 'Daily Comp Settlement',
            createdAt: sf.timestamp,
        });
        await this.compRepository.createTransaction(transaction);

        this.logger.log(`Comp Settlement Processed: user=${userId}, amount=${totalEarned}, rewardId=${reward.id}`);
    }
}
