import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WalletQueryService } from './wallet-query.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { ExchangeCurrencyCode, Prisma, WalletTransactionType, WalletBalanceType, AdjustmentReasonCode } from '@prisma/client';
import { WalletTransaction, WalletNotFoundException, UserWallet, UserWalletPolicy, UpdateOperation, InsufficientBalanceException, InvalidWalletBalanceTypeException } from '../domain';

export interface BalanceUpdateContext {
    // Admin Context
    adminUserId?: bigint;
    reasonCode?: AdjustmentReasonCode;
    internalNote?: string;

    // System Context
    serviceName?: string;
    triggerId?: string;
    actionName?: string;
    metadata?: Record<string, any>;
}

export interface BalanceUpdateParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    operation: UpdateOperation;
    balanceType: WalletBalanceType;
    transactionType: WalletTransactionType;
    referenceId?: string;
}

@Injectable()
export class UserBalanceService {
    private readonly logger = new Logger(UserBalanceService.name);

    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly walletRepository: UserWalletRepositoryPort,
        private readonly walletQueryService: WalletQueryService,
        @Inject(WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: WalletTransactionRepositoryPort,
        private readonly walletPolicy: UserWalletPolicy,
    ) { }

    /**
     * 잔액 변경 및 트랜잭션 기록 (Atomic Operation)
     */
    @Transactional()
    async updateBalance(
        params: BalanceUpdateParams,
        context: BalanceUpdateContext = {},
    ): Promise<UserWallet> {
        const { userId, currency, amount, operation, balanceType, transactionType, referenceId } = params;

        // 1. Lock & Get Wallet
        await this.walletRepository.acquireLock(userId);

        let wallet = await this.walletQueryService.getWallet(userId, currency, false);
        if (!wallet) {
            throw new WalletNotFoundException(userId, currency);
        }

        // 2. Check Wallet Status by Policy
        this.walletPolicy.canPerformTransaction(wallet, transactionType);

        const balanceAfter = this.calculateBalanceAfter(wallet, balanceType, operation, amount);

        // 3. Update Domain Entity
        this.applyUpdate(wallet, balanceType, operation, amount);

        // 4. Save Wallet
        const savedWallet = await this.walletRepository.update(wallet);

        // 5. Create Transaction History with Metadata
        const metadata = this.buildMetadata(transactionType, context);

        const transaction = WalletTransaction.create({
            userId,
            currency,
            type: transactionType,
            balanceType,
            amount: operation === UpdateOperation.ADD ? amount : amount.neg(),
            balanceAfter,
            referenceId,
            metadata,
        });

        await this.transactionRepository.create(transaction);

        return savedWallet;
    }

    private buildMetadata(type: WalletTransactionType, context: BalanceUpdateContext): any {
        const baseMetadata = context.metadata || {};

        if (type === WalletTransactionType.ADJUSTMENT) {
            return {
                ...baseMetadata,
                adminId: context.adminUserId?.toString() || 'SYSTEM',
                reasonCode: context.reasonCode || AdjustmentReasonCode.OTHER,
                internalNote: context.internalNote,
                actionName: context.actionName,
            };
        }

        return {
            ...baseMetadata,
            description: context.internalNote || context.actionName,
        };
    }

    private calculateBalanceAfter(
        wallet: UserWallet,
        type: WalletBalanceType,
        op: UpdateOperation,
        amount: Prisma.Decimal
    ): Prisma.Decimal {
        const current = this.getBalanceByType(wallet, type);
        return op === UpdateOperation.ADD ? current.add(amount) : current.sub(amount);
    }

    private getBalanceByType(wallet: UserWallet, type: WalletBalanceType): Prisma.Decimal {
        switch (type) {
            case WalletBalanceType.CASH: return wallet.cash;
            case WalletBalanceType.BONUS: return wallet.bonus;
            case WalletBalanceType.REWARD: return wallet.reward;
            case WalletBalanceType.LOCK: return wallet.lock;
            case WalletBalanceType.VAULT: return wallet.vault;
            default:
                throw new InvalidWalletBalanceTypeException(type);
        }
    }

    private applyUpdate(
        wallet: UserWallet,
        type: WalletBalanceType,
        op: UpdateOperation,
        amount: Prisma.Decimal
    ) {
        if (op === UpdateOperation.ADD) {
            switch (type) {
                case WalletBalanceType.CASH: wallet.increaseCash(amount); break;
                case WalletBalanceType.BONUS: wallet.increaseBonus(amount); break;
                case WalletBalanceType.REWARD: wallet.increaseReward(amount); break;
                case WalletBalanceType.LOCK: wallet.increaseLock(amount); break;
                case WalletBalanceType.VAULT: wallet.increaseVault(amount); break;
                default: throw new InvalidWalletBalanceTypeException(type);
            }
        } else {
            switch (type) {
                case WalletBalanceType.CASH: wallet.decreaseCash(amount); break;
                case WalletBalanceType.BONUS: wallet.decreaseBonus(amount); break;
                case WalletBalanceType.REWARD: wallet.decreaseReward(amount); break;
                case WalletBalanceType.LOCK: wallet.decreaseLock(amount); break;
                case WalletBalanceType.VAULT: wallet.decreaseVault(amount); break;
                default: throw new InvalidWalletBalanceTypeException(type);
            }
        }
    }
}
