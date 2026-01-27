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
import { USER_WALLET_STATS_REPOSITORY } from '../ports/out/user-wallet-stats.repository.token';
import type { UserWalletStatsRepositoryPort, UpdateWalletStatsDto } from '../ports/out/user-wallet-stats.repository.port';

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
        @Inject(USER_WALLET_STATS_REPOSITORY)
        private readonly statsRepository: UserWalletStatsRepositoryPort,
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

        // 6. Update Wallet Stats (Sync)
        const statsDto = this.buildStatsUpdateDto(
            userId,
            currency,
            amount,
            operation,
            balanceType,
            transactionType,
            { cash: wallet.cash, bonus: wallet.bonus },
            transaction.createdAt // 트랜잭션 시간 전달
        );

        if (statsDto) {
            await this.statsRepository.increaseTotalStats(statsDto);
            await this.statsRepository.updateHourlyStats(statsDto);
        }

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

    private buildStatsUpdateDto(
        userId: bigint,
        currency: ExchangeCurrencyCode,
        amount: Prisma.Decimal,
        op: UpdateOperation,
        balanceType: UserWalletBalanceType,
        transactionType: UserWalletTransactionType,
        currentBalance: { cash: Prisma.Decimal, bonus: Prisma.Decimal },
        timestamp: Date
    ): UpdateWalletStatsDto | null {
        // 통계에 반영하지 않아도 되는 트랜잭션 타입 필터링 (필요시)

        let updateDto: UpdateWalletStatsDto = {
            userId,
            currency,
            currentBalance,
            timestamp, // 시간 동기화
        };

        // 0보다 큰 금액일 경우에만 통계 증감 필드 매핑
        if (amount.gt(0)) {
            // Signed Amount calculation for correct stats update
            // Note: Stats fields (TotalDeposit, TotalBet etc) are always POSITIVE accumulations.
            // We only map specific transaction types to specific stats counters.

            // 1. Deposit (Cash)
            // 입금(ADD) -> 통계 증가, 회수/취소(SUBTRACT) -> 통계 감소 (Net Deposit 유지)
            if (transactionType === UserWalletTransactionType.DEPOSIT && balanceType === UserWalletBalanceType.CASH) {
                updateDto.depositCash = op === UpdateOperation.ADD ? amount : amount.neg();
            }

            // 2. Withdraw (Cash)
            // 출금신청(SUBTRACT) -> 통계 증가, 반려/취소(ADD) -> 통계 감소 (Net Withdraw 유지)
            else if (transactionType === UserWalletTransactionType.WITHDRAW && balanceType === UserWalletBalanceType.CASH) {
                updateDto.withdrawCash = op === UpdateOperation.SUBTRACT ? amount : amount.neg();
            }

            // 3. Bet / Win (Cash & Bonus)
            else if (transactionType === UserWalletTransactionType.BET) {
                if (balanceType === UserWalletBalanceType.CASH) updateDto.betCash = amount;
                if (balanceType === UserWalletBalanceType.BONUS) updateDto.betBonus = amount;
            } else if (transactionType === UserWalletTransactionType.WIN) {
                if (balanceType === UserWalletBalanceType.CASH) updateDto.winCash = amount;
                if (balanceType === UserWalletBalanceType.BONUS) updateDto.winBonus = amount;
            }

            // 3. Bonus Given / Used
            else if (transactionType === UserWalletTransactionType.BONUS_IN || transactionType === UserWalletTransactionType.BONUS_CONVERSION || transactionType === UserWalletTransactionType.REFUND) {
                // BONUS_IN: 지급 (Given)
                if (transactionType === UserWalletTransactionType.BONUS_IN) {
                    updateDto.bonusGiven = amount;
                }
                // REFUND Notice:
                // REFUND 트랜잭션은 보통 TotalBet을 차감(감소)해야 하지만, 이는 비즈니스 로직(예: Pushed Bet, Game Cancel)에 따라
                // 별도의 서비스(UpdatePushedBetService 등)에서 정교하게 계산하여 직접 처리합니다.
                // 따라서 이곳 범용 서비스에서는 REFUND에 대한 통계 업데이트를 수행하지 않습니다 (중복 차감 방지).
            }
            else if (transactionType === UserWalletTransactionType.BONUS_OUT) {
                updateDto.bonusUsed = amount; // 회수/만료
            }

            // 4. Comp
            else if (transactionType === UserWalletTransactionType.COMP_CLAIM) {
                updateDto.compUsed = amount; // 콤프 사용 (전환)
                // Note: compEarned is usually triggered by game result, not wallet transaction directly? 
                // If comp claim adds CASH, it's irrelevant to compEarned stats unless defined.
            }

            // 5. Vault
            else if (transactionType === UserWalletTransactionType.VAULT_IN) {
                updateDto.vaultIn = amount;
            } else if (transactionType === UserWalletTransactionType.VAULT_OUT) {
                updateDto.vaultOut = amount;
            }
        }

        // 유의미한 통계 업데이트가 있는지 확인 (기말 잔액 업데이트는 항상 수행하므로 반환)
        return updateDto;
    }
}
