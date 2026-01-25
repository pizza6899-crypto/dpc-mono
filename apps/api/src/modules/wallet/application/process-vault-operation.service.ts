import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, WalletTransactionType, WalletBalanceType } from '@prisma/client';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { UserWallet, WalletTransaction, WalletNotFoundException } from '../domain';
import { Prisma } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export enum VaultOperation {
    DEPOSIT = 'DEPOSIT',   // Cash -> Vault
    WITHDRAW = 'WITHDRAW', // Vault -> Cash
}

export interface ProcessVaultOperationParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    operation: VaultOperation;
}

/**
 * 금고 관리 서비스 (User Use Case)
 * 
 * 사용자가 자신의 가용 자산을 금고로 옮기거나 다시 꺼내는 기능을 처리합니다.
 */
@Injectable()
export class ProcessVaultOperationService {
    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly walletRepository: UserWalletRepositoryPort,
        @Inject(WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: WalletTransactionRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute({ userId, currency, amount, operation }: ProcessVaultOperationParams): Promise<UserWallet> {
        if (amount.isNegative() || amount.isZero()) {
            throw new Error('Amount must be positive');
        }

        // 1. Lock & Get Wallet
        await this.advisoryLockService.acquireLock(LockNamespace.USER_WALLET, userId.toString(), {
            throwThrottleError: true,
        });
        const wallet = await this.walletRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            throw new WalletNotFoundException(userId, currency);
        }

        // Snapshot before update
        const cashBefore = wallet.cash;
        const vaultBefore = wallet.vault;

        // 2. Perform Operation
        if (operation === VaultOperation.DEPOSIT) {
            wallet.depositToVault(amount);
        } else {
            wallet.withdrawFromVault(amount);
        }

        // 3. Save Wallet
        const savedWallet = await this.walletRepository.update(wallet);

        // 4. Record Transactions (Dual Records for Cash & Vault)
        // 4-1. Cash Side Transaction
        const cashTransaction = WalletTransaction.create({
            userId,
            currency,
            type: WalletTransactionType.ADJUSTMENT,
            balanceType: WalletBalanceType.CASH,
            amount: operation === VaultOperation.DEPOSIT ? amount.neg() : amount,
            balanceBefore: cashBefore,
            balanceAfter: wallet.cash,
            metadata: {
                operation,
                description: `Vault ${operation.toLowerCase()} - Cash side`,
                cashBefore: cashBefore.toString(),
                cashAfter: wallet.cash.toString(),
            },
        });
        await this.transactionRepository.create(cashTransaction);

        // 4-2. Vault Side Transaction
        const vaultTransaction = WalletTransaction.create({
            userId,
            currency,
            type: WalletTransactionType.ADJUSTMENT,
            balanceType: WalletBalanceType.VAULT,
            amount: operation === VaultOperation.DEPOSIT ? amount : amount.neg(),
            balanceBefore: vaultBefore,
            balanceAfter: wallet.vault,
            metadata: {
                operation,
                description: `Vault ${operation.toLowerCase()} - Vault side`,
                vaultBefore: vaultBefore.toString(),
                vaultAfter: wallet.vault.toString(),
            },
        });
        await this.transactionRepository.create(vaultTransaction);

        return savedWallet;
    }
}
