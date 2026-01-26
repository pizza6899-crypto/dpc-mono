import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, CompTransactionType, CompClaimStatus } from '@prisma/client';
import { COMP_REPOSITORY, COMP_CONFIG_REPOSITORY, COMP_CLAIM_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort, CompConfigRepositoryPort, CompClaimHistoryRepositoryPort } from '../ports';
import { CompTransaction, InsufficientCompBalanceException, CompClaimHistory, CompPolicy } from '../domain';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { FindUserWalletService } from '../../wallet/application/find-user-wallet.service';
import { UpdateOperation, WalletActionName } from '../../wallet/domain';
import { UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

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
        @Inject(COMP_CONFIG_REPOSITORY)
        private readonly compConfigRepository: CompConfigRepositoryPort,
        @Inject(COMP_CLAIM_HISTORY_REPOSITORY)
        private readonly compClaimHistoryRepository: CompClaimHistoryRepositoryPort,
        private readonly findUserWalletService: FindUserWalletService,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly advisoryLockService: AdvisoryLockService,
        private readonly compPolicy: CompPolicy,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    @Transactional()
    async execute(params: ClaimCompParams): Promise<ClaimCompResult> {
        const { userId, currency, amount } = params;

        // 0. Acquire Lock
        await this.advisoryLockService.acquireLock(LockNamespace.COMP_WALLET, userId.toString(), {
            throwThrottleError: true,
        });

        // 1. Check Configuration
        // 1. Get Wallet
        let wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            throw new InsufficientCompBalanceException(userId, amount.toString(), '0');
        }

        // 2. Check Policy via Domain Service
        const config = await this.compConfigRepository.getConfig(currency);
        this.compPolicy.verifyClaim(config, wallet, amount);

        const balanceBefore = wallet.balance;

        // 3. Apply Claim Logic (Domain)
        wallet = wallet.claim(amount);

        // 4. Persist Wallet
        const savedCompWallet = await this.compRepository.save(wallet);

        // 5. Record Comp Transaction
        const compTx = CompTransaction.create({
            id: this.snowflakeService.generate(new Date()),
            compWalletId: savedCompWallet.id,
            amount: amount.negated(),
            balanceBefore: balanceBefore,
            balanceAfter: savedCompWallet.balance,
            appliedRate: new Prisma.Decimal(1), // ExchangeRate for Comp->Currency
            type: CompTransactionType.CLAIM,
            description: 'Comp conversion to cash',
        });
        const createdCompTx = await this.compRepository.createTransaction(compTx);

        // 6. Create Pending Claim History (Receipt)
        let claimHistory = CompClaimHistory.create({
            userId,
            compWalletTransactionId: createdCompTx.id,
            compAmount: amount,
            compCurrency: currency,
            targetAmount: amount, // 1:1 conversion assumed for now
            targetCurrency: currency,
            exchangeRate: new Prisma.Decimal(1),
            status: CompClaimStatus.PENDING,
        });
        claimHistory = await this.compClaimHistoryRepository.save(claimHistory);

        try {
            // 7. Get Initial Wallet State for Recording
            const walletBefore = await this.findUserWalletService.findWallet(userId, currency, true);
            if (!walletBefore) {
                throw new Error('User wallet not found');
            }

            const beforeMainBalance = walletBefore.cash;
            const beforeBonusBalance = walletBefore.bonus;

            // 8. Update Main User Balance (Cash)
            const savedUserWallet = await this.updateUserBalanceService.updateBalance({
                userId,
                currency,
                amount: amount,
                operation: UpdateOperation.ADD,
                balanceType: UserWalletBalanceType.CASH,
                transactionType: UserWalletTransactionType.COMP_CLAIM,
                referenceId: createdCompTx.id,
            }, {
                actionName: WalletActionName.CLAIM_COMP,
            });

            // 9. Complete History
            // Since WalletTransaction ID is handled inside UpdateUserBalanceService and returned via some indirect way or new flow,
            // we might not get the exact ID here easily unless UpdateUserBalanceService returns it.
            // For now, we update status to COMPLETED. Ideally we link the Wallet Tx ID.
            // Assuming we refactor UpdateUserBalanceService to return transaction ID later or we use referenceId to link.
            claimHistory = claimHistory.complete(BigInt(0)); // TODO: Pass real wallet tx ID
            await this.compClaimHistoryRepository.save(claimHistory);

            this.logger.log(`Comp Claimed: user=${userId}, compDeducted=${amount}, cashAdded=${amount}`);

            return {
                claimedAmount: amount,
                newCompBalance: savedCompWallet.balance,
                newCashBalance: savedUserWallet.cash,
            };

        } catch (error) {
            // Mark history as FAILED
            claimHistory = claimHistory.fail(error.message);
            await this.compClaimHistoryRepository.save(claimHistory);
            throw error;
        }

    }
}
