import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WithdrawalDetail } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface ApproveWithdrawalParams {
    withdrawalId: bigint;
    adminId: bigint;
    note?: string;
}

export interface ApproveWithdrawalResult {
    withdrawalId: bigint;
    status: string;
    processedBy: bigint;
}

@Injectable()
export class ApproveWithdrawalService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    @Transactional()
    async execute(params: ApproveWithdrawalParams): Promise<ApproveWithdrawalResult> {
        const { withdrawalId, adminId, note } = params;

        // 1. 출금 조회
        const withdrawal = await this.repository.getById(withdrawalId);

        // 2. 승인 (엔티티에서 상태 검증: PENDING_REVIEW만 가능)
        withdrawal.approve(adminId, note);

        // 3. 저장
        await this.repository.save(withdrawal);

        // 4. TODO: 자동 처리 시작 (암호화폐인 경우)
        // if (withdrawal.methodType === WithdrawalMethodType.CRYPTO_WALLET) {
        //     await this.processWithdrawalService.execute(withdrawal.id);
        // }

        return {
            withdrawalId: withdrawal.id,
            status: withdrawal.status,
            processedBy: adminId,
        };
    }
}
