import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from 'src/generated/prisma';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompWallet, CompTransaction, CompNotFoundException } from '../domain';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';

interface DeductCompParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    description?: string;
}

@Injectable()
export class DeductCompService {
    private readonly logger = new Logger(DeductCompService.name);

    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
        private readonly analyticsQueueService: AnalyticsQueueService,
    ) { }

    @Transactional()
    async execute(params: DeductCompParams): Promise<CompWallet> {
        const { userId, currency, amount, description } = params;

        // 0. Acquire Lock
        await this.compRepository.acquireLock(userId);

        // 1. Get Wallet
        let wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            throw new CompNotFoundException(userId, currency);
        }

        // 2. Apply Deduct Logic (Domain)
        wallet = wallet.deduct(amount);

        // 3. Persist Wallet
        const savedWallet = await this.compRepository.save(wallet);

        // 4. Record Transaction
        const transaction = CompTransaction.create({
            compWalletId: savedWallet.id,
            amount: amount.negated(),
            balanceAfter: savedWallet.balance,
            type: CompTransactionType.ADMIN,
            description: description || 'Admin Deduction',
        });
        await this.compRepository.createTransaction(transaction);

        // 5. Enqueue Analytics
        await this.analyticsQueueService.enqueueComp({
            userId,
            currency,
            deductedAmount: amount,
            date: new Date(),
        });

        this.logger.log(`Comp Deducted by Admin: user=${userId}, amount=${amount}, curr=${currency}, newBal=${savedWallet.balance}`);

        return savedWallet;
    }
}
