import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, WalletStatus, WalletTransactionType, WalletBalanceType } from '@prisma/client';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { UserWallet, WalletTransaction, UserWalletPolicy, WalletNotFoundException } from '../domain';
import { Prisma } from '@prisma/client';

export interface UpdateWalletStatusParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    newStatus: WalletStatus;
    adminId: string;
    reason?: string;
}

/**
 * 지갑 상태 업데이트 서비스 (Admin Use Case)
 * 
 * 지갑의 상태를 변경하고 그 이력을 기록합니다.
 */
@Injectable()
export class UpdateWalletStatusService {
    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly walletRepository: UserWalletRepositoryPort,
        @Inject(WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: WalletTransactionRepositoryPort,
        private readonly walletPolicy: UserWalletPolicy,
    ) { }

    @Transactional()
    async execute({ userId, currency, newStatus, adminId, reason }: UpdateWalletStatusParams): Promise<UserWallet> {
        // 1. Lock & Get Wallet
        await this.walletRepository.acquireLock(userId);
        const wallet = await this.walletRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            throw new WalletNotFoundException(userId, currency);
        }

        const prevStatus = wallet.status;
        if (prevStatus === newStatus) return wallet;

        // 2. Validate State Transition by Policy
        if (newStatus === WalletStatus.FROZEN && !this.walletPolicy.canFreeze(wallet)) {
            throw new Error(`Cannot freeze wallet in ${prevStatus} status`);
        }
        if (newStatus === WalletStatus.ACTIVE && !this.walletPolicy.canActivate(wallet)) {
            throw new Error(`Cannot activate wallet in ${prevStatus} status`);
        }

        // 3. Update Status
        switch (newStatus) {
            case WalletStatus.ACTIVE: wallet.activate(); break;
            case WalletStatus.FROZEN: wallet.freeze(); break;
            case WalletStatus.INACTIVE: wallet.deactivate(); break;
            case WalletStatus.READ_ONLY: wallet.setReadOnly(); break;
            case WalletStatus.WITHDRAWAL_RESTRICTED: wallet.restrictWithdrawal(); break;
            case WalletStatus.TERMINATED: wallet.terminate(); break;
        }

        // 4. Save Wallet
        const savedWallet = await this.walletRepository.update(wallet);

        // 5. Record Status Change Transaction
        const transaction = WalletTransaction.create({
            userId,
            currency,
            type: WalletTransactionType.STATUS_CHANGE,
            balanceType: WalletBalanceType.CASH, // 상태 변경은 특정 잔액 타입에 귀속되지 않으나 필드 제약상 CASH 기본값 사용
            amount: new Prisma.Decimal(0),
            balanceAfter: wallet.cash,
            metadata: {
                prevStatus,
                nextStatus: newStatus,
                changedBy: 'ADMIN',
                adminId,
                reason,
            },
        });

        await this.transactionRepository.create(transaction);

        return savedWallet;
    }
}
