import { Injectable, Inject } from '@nestjs/common';
import { WithdrawalDetail, WithdrawalNotFoundException } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface GetWithdrawalParams {
    userId: bigint;
    withdrawalId: bigint;
}

@Injectable()
export class GetWithdrawalService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(params: GetWithdrawalParams): Promise<WithdrawalDetail> {
        const { userId, withdrawalId } = params;

        const withdrawal = await this.repository.getById(withdrawalId);

        // 소유권 확인
        if (withdrawal.userId !== userId) {
            // 소유권이 없으면 not found로 처리 (보안상 존재 여부 숨김)
            throw new WithdrawalNotFoundException(withdrawalId);
        }

        return withdrawal;
    }
}
