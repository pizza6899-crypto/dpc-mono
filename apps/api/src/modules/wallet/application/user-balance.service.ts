import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WalletQueryService } from './wallet-query.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { ExchangeCurrencyCode, Prisma, WalletTransactionType, WalletBalanceType, AdjustmentReasonCode } from '@prisma/client';
import { WalletTransaction, WalletNotFoundException, UserWallet } from '../domain';
import { UpdateOperation } from '../domain/wallet.constant';

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
    operation: UpdateOperation; // ADD | SUBTRACT
    balanceType: WalletBalanceType; // CASH | BONUS | ...
    transactionType: WalletTransactionType; // ADMIN_ADJUST | GAME | DEPOSIT | ...
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
            // 운영 로직에 따라 자동 생성 여부 결정 가능. 
            // 여기서는 명시적 에러 혹은 파라미터로 제어. 일단 에러 처리.
            throw new WalletNotFoundException(userId, currency);
        }

        // 2. Snapshot before update
        // (For transaction history)
        // 현재는 Cash/Bonus 등 개별 필드 업데이트 로직이 필요.
        // Entity에 update 메서드가 있어야 함. 
        // UserWallet Entity에는 increaseCash, decreaseCash 등이 있음.

        const balanceBefore = this.getBalanceByType(wallet, balanceType);

        // 3. Update Domain Entity
        this.applyUpdate(wallet, balanceType, operation, amount);

        const balanceAfter = this.getBalanceByType(wallet, balanceType);

        // 4. Save Wallet
        const savedWallet = await this.walletRepository.update(wallet);

        // 5. Create Transaction History
        const transaction = WalletTransaction.create({
            userId,
            currency,
            type: transactionType,
            balanceType,
            amount: operation === UpdateOperation.ADD ? amount : amount.neg(), // 부호 반영
            balanceAfter,
            referenceId,
            remark: context.internalNote || context.actionName,
            // Admin/System Detail 등은 Entity 확장이 필요하거나 메타데이터로 처리
            // 현재 WalletTransaction Entity는 adminDetail/systemDetail 필드가 없음 (새 스키마 기준)
            // 필요한 경우 remark나 JSON 메타데이터 필드 활용 가능.
            // 새 스키마의 WalletTransaction에는 adminUserId 같은 필드가 없음.
            // -> 스키마 수정 시 제거됨. 
            // 만약 감사가 중요하다면 remark에 JSON string으로 넣거나 별도 Audit 테이블 사용.
            // 여기서는 remark에 사유를 적는 것으로 대체.
        });

        await this.transactionRepository.create(transaction);

        return savedWallet;
    }

    private getBalanceByType(wallet: UserWallet, type: WalletBalanceType): Prisma.Decimal {
        switch (type) {
            case WalletBalanceType.CASH: return wallet.cash;
            case WalletBalanceType.BONUS: return wallet.bonus;
            case WalletBalanceType.REWARD: return wallet.reward;
            case WalletBalanceType.LOCK: return wallet.lock;
            case WalletBalanceType.VAULT: return wallet.vault;
            default: return new Prisma.Decimal(0);
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
            }
        } else {
            switch (type) {
                case WalletBalanceType.CASH: wallet.decreaseCash(amount); break;
                case WalletBalanceType.BONUS: wallet.decreaseBonus(amount); break;
                case WalletBalanceType.REWARD: wallet.decreaseReward(amount); break;
                case WalletBalanceType.LOCK: wallet.decreaseLock(amount); break;
                case WalletBalanceType.VAULT: wallet.decreaseVault(amount); break;
            }
        }
    }
}
