import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from '@prisma/client';
import { COMP_CONFIG_REPOSITORY, COMP_REPOSITORY } from '../ports/repository.token';
import type { CompConfigRepositoryPort, CompRepositoryPort } from '../ports';
import { CompWallet, CompTransaction, CompPolicy, CompPolicyViolationException } from '../domain';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

interface EarnCompParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    referenceId?: bigint; // e.g. gameRoundId or transactionId
    description?: string;
    options?: {
        transactionType?: CompTransactionType;
        bypassPolicy?: boolean;
        processedBy?: bigint; // Admin User ID
    };
}

@Injectable()
export class EarnCompService {
    private readonly logger = new Logger(EarnCompService.name);

    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
        @Inject(COMP_CONFIG_REPOSITORY)
        private readonly compConfigRepository: CompConfigRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
        private readonly compPolicy: CompPolicy,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    @Transactional()
    async execute(params: EarnCompParams): Promise<CompWallet> {
        const { userId, currency, amount, referenceId, description } = params;

        // 0. Acquire Lock
        await this.advisoryLockService.acquireLock(LockNamespace.COMP_WALLET, userId.toString(), {
            throwThrottleError: true,
        });

        // 1. Check Configuration via Policy (if not bypassed)
        if (!params.options?.bypassPolicy) {
            const config = await this.compConfigRepository.getConfig(currency);

            try {
                this.compPolicy.verifyEarn(config, userId);
            } catch (error) {
                if (error instanceof CompPolicyViolationException) {
                    this.logger.warn(`Comp earn skipped: ${error.message}`);
                    // Return current wallet without changes
                    let wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
                    if (!wallet) return CompWallet.create({ userId, currency });
                    return wallet;
                }
                throw error;
            }
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
            id: this.snowflakeService.generate().id,
            compWalletId: savedWallet.id,
            amount: amount,
            balanceBefore: balanceBefore,
            balanceAfter: savedWallet.balance,
            appliedRate: new Prisma.Decimal(1), // Default rate
            type: params.options?.transactionType ?? CompTransactionType.EARN,
            referenceId: referenceId,
            processedBy: params.options?.processedBy,
            description,
        });
        await this.compRepository.createTransaction(transaction);

        this.logger.log(`Comp Earned: user=${userId}, amount=${amount}, curr=${currency}, newBal=${savedWallet.balance}`);

        return savedWallet;
    }
}
