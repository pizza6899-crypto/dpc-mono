import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, UserWalletStatus, UserWalletTransactionType, UserWalletBalanceType } from '@prisma/client';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_WALLET_TRANSACTION_REPOSITORY } from '../ports/out/user-wallet-transaction.repository.token';
import type { UserWalletTransactionRepositoryPort } from '../ports/out/user-wallet-transaction.repository.port';
import { UserWallet, UserWalletTransaction, UserWalletPolicy, WalletNotFoundException, WalletStatusException } from '../domain';
import { Prisma } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

export interface UpdateWalletStatusParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    newStatus: UserWalletStatus;
    adminId: bigint;
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
        @Inject(USER_WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: UserWalletTransactionRepositoryPort,
        private readonly walletPolicy: UserWalletPolicy,
        private readonly advisoryLockService: AdvisoryLockService,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    @Transactional()
    async execute({ userId, currency, newStatus, adminId, reason }: UpdateWalletStatusParams): Promise<UserWallet> {
        // 1. Lock & Get Wallet
        await this.advisoryLockService.acquireLock(LockNamespace.USER_WALLET, userId.toString(), {
            throwThrottleError: true,
        });
        const wallet = await this.walletRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            throw new WalletNotFoundException(userId, currency);
        }

        const prevStatus = wallet.status;
        if (prevStatus === newStatus) return wallet;

        // 2. Validate State Transition by Policy
        // Status Transition Validation
        if (newStatus === UserWalletStatus.FROZEN && prevStatus === UserWalletStatus.FROZEN) {
            throw new WalletStatusException(`Wallet is already frozen`);
        }
        if (newStatus === UserWalletStatus.FROZEN && prevStatus === UserWalletStatus.INACTIVE) {
            throw new WalletStatusException(`Cannot freeze wallet in ${prevStatus} status`);
        }
        if (newStatus === UserWalletStatus.ACTIVE && prevStatus === UserWalletStatus.TERMINATED) {
            throw new WalletStatusException(`Cannot activate wallet in ${prevStatus} status`);
        }

        if (newStatus === UserWalletStatus.FROZEN && !this.walletPolicy.canFreeze(wallet)) {
            throw new WalletStatusException(`Cannot freeze wallet in ${prevStatus} status`);
        }
        if (newStatus === UserWalletStatus.ACTIVE && !this.walletPolicy.canActivate(wallet)) {
            throw new WalletStatusException(`Cannot activate wallet in ${prevStatus} status`);
        }

        // 3. Update Status
        switch (newStatus) {
            case UserWalletStatus.ACTIVE: wallet.activate(); break;
            case UserWalletStatus.FROZEN: wallet.freeze(); break;
            case UserWalletStatus.INACTIVE: wallet.deactivate(); break;
            case UserWalletStatus.READ_ONLY: wallet.setReadOnly(); break;
            case UserWalletStatus.WITHDRAWAL_RESTRICTED: wallet.restrictWithdrawal(); break;
            case UserWalletStatus.TERMINATED: wallet.terminate(); break;
        }

        // 4. Save Wallet
        const savedWallet = await this.walletRepository.update(wallet);

        // 5. Record Status Change Transaction
        const { id, timestamp } = this.snowflakeService.generate();

        const transaction = UserWalletTransaction.create({
            id,
            createdAt: timestamp,
            userId,
            currency,
            type: UserWalletTransactionType.STATUS_CHANGE,
            balanceType: UserWalletBalanceType.CASH, // 상태 변경은 특정 잔액 타입에 귀속되지 않으나 필드 제약상 CASH 기본값 사용
            amount: new Prisma.Decimal(0),
            balanceBefore: wallet.cash,
            balanceAfter: wallet.cash,
            metadata: {
                prevStatus,
                nextStatus: newStatus,
                changedBy: 'ADMIN',
                adminId: adminId.toString(),
                reason,
            },
        });

        await this.transactionRepository.create(transaction);

        return savedWallet;
    }
}
