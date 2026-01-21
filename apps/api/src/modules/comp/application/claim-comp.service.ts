import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, CompTransactionType, TransactionType, TransactionStatus } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompTransaction, InsufficientCompBalanceException } from '../domain';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { FindUserWalletService } from '../../wallet/application/find-user-wallet.service';
import { UpdateOperation } from '../../wallet/domain';
import { WalletBalanceType, WalletTransactionType } from '@prisma/client';
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
        private readonly findUserWalletService: FindUserWalletService,
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
        const savedCompWallet = await this.compRepository.save(wallet);

        // 4. Record Comp Transaction
        const compTx = CompTransaction.create({
            compWalletId: savedCompWallet.id,
            amount: amount.negated(),
            balanceAfter: savedCompWallet.balance,
            type: CompTransactionType.CLAIM,
            description: 'Comp conversion to cash',
        });
        const createdCompTx = await this.compRepository.createTransaction(compTx);

        // 5. Get Initial Wallet State for Recording
        const walletBefore = await this.findUserWalletService.findWallet(userId, currency, true);
        if (!walletBefore) {
            throw new Error('User wallet not found');
        }

        const beforeMainBalance = walletBefore.cash;
        const beforeBonusBalance = walletBefore.bonus;

        // 6. Update Main User Balance (Cash)
        const savedUserWallet = await this.updateUserBalanceService.updateBalance({
            userId,
            currency,
            amount: amount,
            operation: UpdateOperation.ADD,
            balanceType: WalletBalanceType.CASH,
            transactionType: 'COMP_CLAIM' as unknown as WalletTransactionType,
            referenceId: createdCompTx.id.toString(),
        }, {
            actionName: 'COMP_CLAIM',
        });

        const afterMainBalance = savedUserWallet.cash;
        const afterBonusBalance = savedUserWallet.bonus;

        const mainBalanceChange = afterMainBalance.sub(beforeMainBalance);
        const bonusBalanceChange = afterBonusBalance.sub(beforeBonusBalance);

        // 7. Record Main Wallet Transaction
        await this.compRepository.createMainTransaction({
            userId,
            type: TransactionType.COMP_CLAIM,
            status: TransactionStatus.COMPLETED,
            currency,
            amount: amount,
            beforeAmount: beforeMainBalance.add(beforeBonusBalance),
            afterAmount: afterMainBalance.add(afterBonusBalance),
            compWalletTransactionId: createdCompTx.id,
            balanceDetails: {
                mainBalanceChange: mainBalanceChange,
                mainBeforeAmount: beforeMainBalance,
                mainAfterAmount: afterMainBalance,
                bonusBalanceChange: bonusBalanceChange,
                bonusBeforeAmount: beforeBonusBalance,
                bonusAfterAmount: afterBonusBalance,
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
            newCompBalance: savedCompWallet.balance,
            newCashBalance: afterMainBalance,
        };
    }
}
