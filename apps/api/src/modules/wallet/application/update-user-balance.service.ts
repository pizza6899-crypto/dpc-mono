import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { FindUserWalletService } from './find-user-wallet.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_WALLET_TRANSACTION_REPOSITORY } from '../ports/out/user-wallet-transaction.repository.token';
import type { UserWalletTransactionRepositoryPort } from '../ports/out/user-wallet-transaction.repository.port';
import { ExchangeCurrencyCode, Prisma, UserWalletTransactionType, UserWalletBalanceType, AdjustmentReasonCode } from '@prisma/client';
import { UserWalletTransaction, WalletNotFoundException, UserWallet, UserWalletPolicy, UpdateOperation, InvalidWalletBalanceTypeException, WalletActionName, AnyWalletTransactionMetadata } from '../domain';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export interface BalanceUpdateContext {
    // Admin Context
    adminUserId?: bigint;
    reasonCode?: AdjustmentReasonCode;
    internalNote?: string;

    // System Context
    serviceName?: string;
    triggerId?: string;
    actionName?: WalletActionName;
    metadata?: AnyWalletTransactionMetadata;
}

export interface BalanceUpdateParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    operation: UpdateOperation;
    balanceType: UserWalletBalanceType;
    transactionType: UserWalletTransactionType;
    referenceId?: bigint;
}

@Injectable()
export class UpdateUserBalanceService {
    private readonly logger = new Logger(UpdateUserBalanceService.name);

    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly walletRepository: UserWalletRepositoryPort,
        private readonly findUserWalletService: FindUserWalletService,
        @Inject(USER_WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: UserWalletTransactionRepositoryPort,
        private readonly walletPolicy: UserWalletPolicy,
        private readonly advisoryLockService: AdvisoryLockService,
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
        await this.advisoryLockService.acquireLock(LockNamespace.USER_WALLET, userId.toString(), {
            throwThrottleError: true,
        });

        let wallet = await this.findUserWalletService.findWallet(userId, currency, false);
        if (!wallet) {
            throw new WalletNotFoundException(userId, currency);
        }

        // Snapshot before update
        const beforeBalance = {
            cash: wallet.cash,
            bonus: wallet.bonus,
        };

        // 2. Check Wallet Status by Policy
        this.walletPolicy.canPerformTransaction(wallet, transactionType);

        const balanceBefore = this.getBalanceByType(wallet, balanceType);
        const balanceAfter = this.calculateBalanceAfter(wallet, balanceType, operation, amount);

        // 3. Update Domain Entity
        this.applyUpdate(wallet, balanceType, operation, amount);

        // 4. Save Wallet
        const savedWallet = await this.walletRepository.update(wallet);

        // 5. Create Transaction History with Metadata
        const metadata = this.buildMetadata(transactionType, context, {
            before: beforeBalance,
            after: { cash: wallet.cash, bonus: wallet.bonus },
            changeAmount: amount,
            operation,
            balanceType
        });

        const transaction = UserWalletTransaction.create({
            userId,
            currency,
            type: transactionType,
            balanceType,
            amount: operation === UpdateOperation.ADD ? amount : amount.neg(),
            balanceBefore,
            balanceAfter,
            referenceId,
            metadata,
        });

        await this.transactionRepository.create(transaction);

        return savedWallet;
    }

    private buildMetadata(
        type: UserWalletTransactionType,
        context: BalanceUpdateContext,
        balanceInfo: {
            before: { cash: Prisma.Decimal, bonus: Prisma.Decimal },
            after: { cash: Prisma.Decimal, bonus: Prisma.Decimal },
            changeAmount: Prisma.Decimal,
            operation: UpdateOperation,
            balanceType: UserWalletBalanceType
        }
    ): AnyWalletTransactionMetadata {
        const baseMetadata = context.metadata || {};

        // Calculate detailed balance changes
        const isCash = balanceInfo.balanceType === UserWalletBalanceType.CASH;
        const isBonus = balanceInfo.balanceType === UserWalletBalanceType.BONUS;
        const sign = balanceInfo.operation === UpdateOperation.ADD ? 1 : -1;

        const balanceDetail = {
            mainBalanceChange: isCash ? balanceInfo.changeAmount.mul(sign).toString() : '0',
            mainBeforeAmount: balanceInfo.before.cash.toString(),
            mainAfterAmount: balanceInfo.after.cash.toString(),
            bonusBalanceChange: isBonus ? balanceInfo.changeAmount.mul(sign).toString() : '0',
            bonusBeforeAmount: balanceInfo.before.bonus.toString(),
            bonusAfterAmount: balanceInfo.after.bonus.toString(),
        };

        const result: any = {
            ...baseMetadata,
            balanceDetail,
        };

        if (type === UserWalletTransactionType.ADJUSTMENT) {
            result.adminId = context.adminUserId?.toString() || 'SYSTEM';
            result.reasonCode = context.reasonCode || AdjustmentReasonCode.OTHER;
            result.internalNote = context.internalNote;
            result.actionName = context.actionName;
        } else {
            result.description = context.internalNote || context.actionName;
        }

        return result as AnyWalletTransactionMetadata;
    }

    private calculateBalanceAfter(
        wallet: UserWallet,
        type: UserWalletBalanceType,
        op: UpdateOperation,
        amount: Prisma.Decimal
    ): Prisma.Decimal {
        const current = this.getBalanceByType(wallet, type);
        return op === UpdateOperation.ADD ? current.add(amount) : current.sub(amount);
    }

    private getBalanceByType(wallet: UserWallet, type: UserWalletBalanceType): Prisma.Decimal {
        switch (type) {
            case UserWalletBalanceType.CASH: return wallet.cash;
            case UserWalletBalanceType.BONUS: return wallet.bonus;
            case UserWalletBalanceType.LOCK: return wallet.lock;
            case UserWalletBalanceType.VAULT: return wallet.vault;
            default:
                throw new InvalidWalletBalanceTypeException(type);
        }
    }

    private applyUpdate(
        wallet: UserWallet,
        type: UserWalletBalanceType,
        op: UpdateOperation,
        amount: Prisma.Decimal
    ) {
        if (op === UpdateOperation.ADD) {
            switch (type) {
                case UserWalletBalanceType.CASH: wallet.increaseCash(amount); break;
                case UserWalletBalanceType.BONUS: wallet.increaseBonus(amount); break;
                case UserWalletBalanceType.LOCK: wallet.increaseLock(amount); break;
                case UserWalletBalanceType.VAULT: wallet.increaseVault(amount); break;
                default: throw new InvalidWalletBalanceTypeException(type);
            }
        } else {
            switch (type) {
                case UserWalletBalanceType.CASH: wallet.decreaseCash(amount); break;
                case UserWalletBalanceType.BONUS: wallet.decreaseBonus(amount); break;
                case UserWalletBalanceType.LOCK: wallet.decreaseLock(amount); break;
                case UserWalletBalanceType.VAULT: wallet.decreaseVault(amount); break;
                default: throw new InvalidWalletBalanceTypeException(type);
            }
        }
    }
}
