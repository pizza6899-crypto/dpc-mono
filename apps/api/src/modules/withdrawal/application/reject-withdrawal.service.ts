import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation } from 'src/modules/wallet/domain';
import { WalletBalanceType, WalletTransactionType } from '@prisma/client';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface RejectWithdrawalParams {
    withdrawalId: bigint;
    adminId: bigint;
    reason: string;
}

export interface RejectWithdrawalResult {
    withdrawalId: bigint;
    status: string;
    processedBy: bigint;
    reason: string;
}

@Injectable()
export class RejectWithdrawalService {
    private readonly logger = new Logger(RejectWithdrawalService.name);

    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
    ) { }

    @Transactional()
    async execute(params: RejectWithdrawalParams): Promise<RejectWithdrawalResult> {
        const { withdrawalId, adminId, reason } = params;

        // 1. 출금 조회
        const withdrawal = await this.repository.getById(withdrawalId);

        // 2. 거부 (엔티티에서 상태 검증: PENDING_REVIEW만 가능)
        withdrawal.reject(adminId, reason);

        // 3. 저장
        await this.repository.save(withdrawal);

        // 4. 잔액 복원 (mainBalance에 복원)
        try {
            await this.updateUserBalanceService.updateBalance({
                userId: withdrawal.userId,
                currency: withdrawal.currency,
                amount: withdrawal.requestedAmount,
                operation: UpdateOperation.ADD,
                balanceType: WalletBalanceType.CASH,
                transactionType: WalletTransactionType.REFUND, // 환불 타입으로 기록
                referenceId: withdrawal.id.toString(),
            }, {
                adminUserId: adminId,
                internalNote: `Withdrawal rejected: ${reason}`,
                actionName: 'REJECT_WITHDRAWAL',
            });
        } catch (error) {
            this.logger.error(
                `Failed to restore balance for rejected withdrawal ${withdrawalId}`,
                error instanceof Error ? error.stack : String(error),
            );
            // 잔액 복원 실패는 로깅하고 계속 진행 (수동 처리 필요)
        }

        return {
            withdrawalId: withdrawal.id,
            status: withdrawal.status,
            processedBy: adminId,
            reason,
        };
    }
}
