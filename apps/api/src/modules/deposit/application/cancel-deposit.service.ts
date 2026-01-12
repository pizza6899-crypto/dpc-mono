// src/modules/deposit/application/cancel-deposit.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';

interface CancelDepositParams {
    id: bigint;
    userId: bigint;
}

@Injectable()
export class CancelDepositService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
    ) { }

    @Transactional()
    async execute(params: CancelDepositParams): Promise<void> {
        const { id, userId } = params;

        // 1. 락 획득
        await this.depositRepository.acquireDepositLock(id);

        // 2. DepositDetail 조회 (본인 것만)
        const deposit = await this.depositRepository.findByIdAndUserId(id, userId);
        if (!deposit) {
            throw new NotFoundException('Deposit request not found');
        }

        // 3. 엔티티 비즈니스 로직 실행 (취소 처리)
        deposit.cancel();

        // 4. 상태 업데이트
        await this.depositRepository.update(deposit);
    }
}
