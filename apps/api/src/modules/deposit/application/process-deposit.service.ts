// src/modules/deposit/application/process-deposit.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { DepositMethodType } from '@prisma/client';
import { DepositUnauthorizedActionException, DepositNotFoundException } from '../domain';

interface ProcessDepositParams {
    id: bigint;
    adminId: bigint;
}

@Injectable()
export class ProcessDepositService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(params: ProcessDepositParams): Promise<void> {
        const { id, adminId } = params;

        // 락 획득 (DB Advisory Lock)
        await this.advisoryLockService.acquireLock(
            LockNamespace.DEPOSIT,
            id.toString(),
            {
                throwThrottleError: true,
            },
        );

        // 1. DepositDetail 조회
        const deposit = await this.depositRepository.findById(id);
        if (!deposit) {
            throw new DepositNotFoundException();
        }

        // 2. 피아트(무통장 입금)인지 확인
        if (deposit.getMethod().methodType !== DepositMethodType.BANK_TRANSFER) {
            throw new DepositUnauthorizedActionException();
        }

        // 3. 엔티티 비즈니스 로직 실행 (상태 선점 시작, PENDING -> PROCESSING)
        // startProcessing 내부에서 PENDING이 아니면 예외를 발생시키므로 단방향이 보장됩니다.
        deposit.startProcessing(adminId);

        // 4. DepositDetail 상태 업데이트
        await this.depositRepository.update(deposit);
    }
}
