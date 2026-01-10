import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WithdrawalDetail } from '../domain';
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
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
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

        // 4. TODO: 잔액 복원 (BalanceService)
        // await this.balanceService.restoreBalance(
        //     withdrawal.userId,
        //     withdrawal.currency,
        //     withdrawal.requestedAmount,
        // );

        return {
            withdrawalId: withdrawal.id,
            status: withdrawal.status,
            processedBy: adminId,
            reason,
        };
    }
}
