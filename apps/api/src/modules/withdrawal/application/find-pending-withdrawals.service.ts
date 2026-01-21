import { Injectable, Inject } from '@nestjs/common';
import { WithdrawalStatus } from '@prisma/client';
import { WithdrawalDetail } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface FindPendingWithdrawalsParams {
    status?: WithdrawalStatus;
    limit?: number;
    offset?: number;
}

export interface FindPendingWithdrawalsResult {
    withdrawals: WithdrawalDetail[];
}

@Injectable()
export class FindPendingWithdrawalsService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(params: FindPendingWithdrawalsParams): Promise<FindPendingWithdrawalsResult> {
        const { status = WithdrawalStatus.PENDING_REVIEW, limit = 50, offset = 0 } = params;

        const withdrawals = await this.repository.findByStatus(status, { limit, offset });

        return { withdrawals };
    }
}
