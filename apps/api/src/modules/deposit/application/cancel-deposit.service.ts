// src/modules/deposit/application/cancel-deposit.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports';
import type { DepositDetailRepositoryPort } from '../ports/deposit-detail.repository.port';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { DepositNotFoundException } from '../domain';

interface CancelDepositParams {
  id: bigint;
  userId: bigint;
}

@Injectable()
export class CancelDepositService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute(params: CancelDepositParams): Promise<void> {
    const { id, userId } = params;

    // 1. 락 획득 (DB Advisory Lock)
    await this.advisoryLockService.acquireLock(
      LockNamespace.DEPOSIT,
      id.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 2. DepositDetail 조회 (본인 것만)
    const deposit = await this.depositRepository.findById(id, { userId });
    if (!deposit) {
      throw new DepositNotFoundException();
    }

    // 3. 엔티티 비즈니스 로직 실행 (취소 처리)
    deposit.cancel();

    // 4. 상태 업데이트
    await this.depositRepository.update(deposit);
  }
}
