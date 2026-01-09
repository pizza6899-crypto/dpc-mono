import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from '@repo/database';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompWallet, CompTransaction } from '../domain';

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
    ) { }

    @Transactional()
    async execute(params: EarnCompParams): Promise<CompWallet> {
        const { userId, currency, amount, referenceId, description } = params;

        // 1. Get or Create Wallet
        let wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            wallet = CompWallet.create({ userId, currency });
        }

        // 2. Apply Earn Logic (Domain)
        wallet = wallet.earn(amount);

        // 3. Persist Wallet
        const savedWallet = await this.compRepository.save(wallet);

        // 4. Record Transaction
        const transaction = CompTransaction.create({
            compWalletId: savedWallet.id,
            amount: amount,
            balanceAfter: savedWallet.balance,
            type: CompTransactionType.EARN,
            referenceId,
            description,
        });
        await this.compRepository.createTransaction(transaction);

        this.logger.log(`Comp Earned: user=${userId}, amount=${amount}, curr=${currency}, newBal=${savedWallet.balance}`);

        return savedWallet;
    }
}
