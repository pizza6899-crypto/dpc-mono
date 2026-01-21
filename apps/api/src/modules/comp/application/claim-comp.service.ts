import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, CompTransactionType, TransactionType, TransactionStatus } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompTransaction, InsufficientCompBalanceException } from '../domain';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { BalanceType, UpdateOperation } from '../../wallet/domain';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';

interface ClaimCompParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
}

interface ClaimCompResult {
    claimedAmount: Prisma.Decimal;
    newCompBalance: Prisma.Decimal;
    newCashBalance: Prisma.Decimal;
}

@Injectable()
export class ClaimCompService {
    private readonly logger = new Logger(ClaimCompService.name);

    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly analyticsQueueService: AnalyticsQueueService,
    ) { }

    @Transactional()
    async execute(params: ClaimCompParams): Promise<ClaimCompResult> {
        const { userId, currency, amount } = params;

        // 0. Acquire Lock
        await this.compRepository.acquireLock(userId);

        // 1. Get Wallet
        let wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet || wallet.balance.lt(amount)) {
            throw new InsufficientCompBalanceException(userId, amount.toString(), wallet?.balance.toString() || '0');
        }

        // 2. Apply Claim Logic (Domain)
        wallet = wallet.claim(amount);

        // 3. Persist Wallet
        const savedWallet = await this.compRepository.save(wallet);

        // 4. Record Comp Transaction
        const compTx = CompTransaction.create({
            compWalletId: savedWallet.id,
            amount: amount.negated(),
            balanceAfter: savedWallet.balance,
            type: CompTransactionType.CLAIM,
            description: 'Comp conversion to cash',
        });
        const createdCompTx = await this.compRepository.createTransaction(compTx);

        // 5. Update Main User Balance (Cash)
        const balanceUpdate = await this.updateUserBalanceService.execute({
            userId,
            currency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: amount,
        });

        // 6. Record Main Wallet Transaction
        await this.compRepository.createMainTransaction({
            userId,
            type: TransactionType.COMP_CLAIM,
            status: TransactionStatus.COMPLETED,
            currency,
            amount: amount,
            beforeAmount: balanceUpdate.beforeMainBalance.add(balanceUpdate.beforeBonusBalance),
            afterAmount: balanceUpdate.afterMainBalance.add(balanceUpdate.afterBonusBalance),
            compWalletTransactionId: createdCompTx.id,
            balanceDetails: {
                mainBalanceChange: balanceUpdate.mainBalanceChange,
                mainBeforeAmount: balanceUpdate.beforeMainBalance,
                mainAfterAmount: balanceUpdate.afterMainBalance,
                bonusBalanceChange: balanceUpdate.bonusBalanceChange,
                bonusBeforeAmount: balanceUpdate.beforeBonusBalance,
                bonusAfterAmount: balanceUpdate.afterBonusBalance,
            },
        });

        // 7. Enqueue Analytics
        await this.analyticsQueueService.enqueueComp({
            userId,
            currency,
            convertedAmount: amount, // Claimed amount is converted amount
            date: new Date(),
        });

        this.logger.log(`Comp Claimed: user=${userId}, compDeducted=${amount}, cashAdded=${amount}`);

        return {
            claimedAmount: amount,
            newCompBalance: savedWallet.balance,
            newCashBalance: balanceUpdate.afterMainBalance,
        };
    }
}
