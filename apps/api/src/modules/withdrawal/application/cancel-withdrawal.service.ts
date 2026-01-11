import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { CreateWalletTransactionService } from 'src/modules/wallet/application/create-wallet-transaction.service';
import { BalanceType, UpdateOperation } from 'src/modules/wallet/domain';
import { TransactionType, TransactionStatus } from '@repo/database';
import { WithdrawalNotFoundException } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface CancelWithdrawalParams {
    userId: bigint;
    withdrawalId: bigint;
}

export interface CancelWithdrawalResult {
    withdrawalId: bigint;
    status: string;
    cancelledAt: Date;
}

@Injectable()
export class CancelWithdrawalService {
    private readonly logger = new Logger(CancelWithdrawalService.name);

    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly createWalletTransactionService: CreateWalletTransactionService,
    ) { }

    @Transactional()
    async execute(params: CancelWithdrawalParams): Promise<CancelWithdrawalResult> {
        const { userId, withdrawalId } = params;

        // 1. 출금 조회
        const withdrawal = await this.repository.getById(withdrawalId);

        // 2. 소유권 확인
        if (withdrawal.userId !== userId) {
            throw new WithdrawalNotFoundException(withdrawalId);
        }

        // 3. 취소 (엔티티에서 상태 검증)
        withdrawal.cancel();

        // 4. 저장
        await this.repository.save(withdrawal);

        // 5. 잔액 복원 (mainBalance에 복원)
        try {
            const balanceResult = await this.updateUserBalanceService.execute({
                userId,
                currency: withdrawal.currency,
                balanceType: BalanceType.MAIN,
                operation: UpdateOperation.ADD,
                amount: withdrawal.requestedAmount,
            });

            // 6. 트랜잭션 기록 생성 (취소/환불)
            await this.createWalletTransactionService.execute({
                userId,
                type: TransactionType.WITHDRAW,
                status: TransactionStatus.CANCELLED,
                currency: withdrawal.currency,
                amount: withdrawal.requestedAmount,
                beforeBalance: balanceResult.beforeMainBalance.add(balanceResult.beforeBonusBalance),
                afterBalance: balanceResult.afterMainBalance.add(balanceResult.afterBonusBalance),
                balanceDetail: {
                    mainBalanceChange: balanceResult.mainBalanceChange,
                    mainBeforeAmount: balanceResult.beforeMainBalance,
                    mainAfterAmount: balanceResult.afterMainBalance,
                    bonusBalanceChange: balanceResult.bonusBalanceChange,
                    bonusBeforeAmount: balanceResult.beforeBonusBalance,
                    bonusAfterAmount: balanceResult.afterBonusBalance,
                },
                description: 'Withdrawal cancelled - balance restored',
                metadata: {
                    withdrawalId: withdrawal.id.toString(),
                    reason: 'USER_CANCELLED'
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to restore balance for cancelled withdrawal ${withdrawalId}`,
                error instanceof Error ? error.stack : String(error),
            );
            // 잔액 복원 실패는 로깅하고 계속 진행 (수동 처리 필요)
        }

        return {
            withdrawalId: withdrawal.id,
            status: withdrawal.status,
            cancelledAt: withdrawal.props.cancelledAt!,
        };
    }
}
