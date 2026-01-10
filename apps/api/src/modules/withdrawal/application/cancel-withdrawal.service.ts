import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
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
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
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

        // 5. TODO: 잔액 복원 (BalanceService)
        // await this.balanceService.restoreBalance(
        //     userId,
        //     withdrawal.currency,
        //     withdrawal.requestedAmount,
        // );

        return {
            withdrawalId: withdrawal.id,
            status: withdrawal.status,
            cancelledAt: withdrawal.props.cancelledAt!,
        };
    }
}
