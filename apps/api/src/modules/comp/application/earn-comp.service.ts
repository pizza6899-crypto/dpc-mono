import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from '@prisma/client';
import { COMP_CONFIG_REPOSITORY, COMP_REPOSITORY } from '../ports/repository.token';
import type { CompConfigRepositoryPort, CompRepositoryPort } from '../ports';
import { CompWallet, CompTransaction } from '../domain';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

interface EarnCompParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    referenceId?: string; // e.g. gameRoundId or transactionId
    description?: string;
}

@Injectable()
export class EarnCompService {
    private readonly logger = new Logger(EarnCompService.name);

    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
        @Inject(COMP_CONFIG_REPOSITORY)
        private readonly compConfigRepository: CompConfigRepositoryPort,
        private readonly analyticsQueueService: AnalyticsQueueService,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(params: EarnCompParams): Promise<CompWallet> {
        const { userId, currency, amount, referenceId, description } = params;

        // 0. Acquire Lock
        await this.advisoryLockService.acquireLock(LockNamespace.COMP_WALLET, userId.toString(), {
            throwThrottleError: true,
        });

        // 1. Check Configuration
        const config = await this.compConfigRepository.getConfig();
        if (config && !config.canEarn()) {
            this.logger.warn(`Comp earn skipped: Earn disabled in config. user=${userId}`);
            // Return current wallet or throw? Returning current wallet (no-op) is safer to not break game flow
            let wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
            if (!wallet) return CompWallet.create({ userId, currency });
            return wallet;
        }

        // 2. Get or Create Wallet
        let wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            wallet = CompWallet.create({ userId, currency });
        }

        const balanceBefore = wallet.balance;

        // 3. Apply Earn Logic (Domain)
        wallet = wallet.earn(amount);

        // 4. Persist Wallet
        const savedWallet = await this.compRepository.save(wallet);

        // 5. Record Transaction
        const transaction = CompTransaction.create({
            compWalletId: savedWallet.id,
            amount: amount,
            balanceBefore: balanceBefore,
            balanceAfter: savedWallet.balance,
            appliedRate: new Prisma.Decimal(1), // Default rate
            type: CompTransactionType.EARN,
            referenceId: referenceId ? BigInt(referenceId) : undefined,
            description,
        });
        await this.compRepository.createTransaction(transaction);

        // 5. Enqueue Analytics
        await this.analyticsQueueService.enqueueComp({
            userId,
            currency,
            earnedAmount: amount,
            date: new Date(),
        });

        this.logger.log(`Comp Earned: user=${userId}, amount=${amount}, curr=${currency}, newBal=${savedWallet.balance}`);

        return savedWallet;
    }
}
