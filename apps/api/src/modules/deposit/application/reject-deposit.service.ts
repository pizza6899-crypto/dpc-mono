// src/modules/deposit/application/reject-deposit.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports';
import type { DepositDetailRepositoryPort } from '../ports/deposit-detail.repository.port';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { CreateAdminMemoService } from '../../admin-memo/application/create-admin-memo.service';
import { DepositNotFoundException } from '../domain';

interface RejectDepositParams {
  id: bigint;
  memo: string;
  adminId: bigint;
}

interface RejectDepositResult {
  userId: string;
}

@Injectable()
export class RejectDepositService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly createAdminMemoService: CreateAdminMemoService,
  ) {}

  @Transactional()
  async execute(params: RejectDepositParams): Promise<RejectDepositResult> {
    const { id, memo, adminId } = params;

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

    // 2. 엔티티 비즈니스 로직 실행 (거부 처리)
    deposit.reject(memo, adminId);

    // 3. DepositDetail 상태 업데이트
    await this.depositRepository.update(deposit);

    // 4. 거절 사유를 관리자 메모로 저장 (트랜잭션 편입)
    if (memo) {
      await this.createAdminMemoService.execute({
        adminId,
        content: `[입금 거절 사유] ${memo}`,
        target: { type: 'DEPOSIT', id },
      });
    }

    return {
      userId: deposit.userId.toString(),
    };
  }
}
