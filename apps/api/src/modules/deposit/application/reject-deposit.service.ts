// src/modules/deposit/application/reject-deposit.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';

interface RejectDepositParams {
  id: bigint;
  failureReason: string;
  adminId: bigint;
}

interface RejectDepositResult {
  userId: string;
}

@Injectable()
export class RejectDepositService {
  private readonly logger = new Logger(RejectDepositService.name);

  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
  ) { }

  @Transactional()
  async execute(params: RejectDepositParams): Promise<RejectDepositResult> {
    const { id, failureReason, adminId } = params;

    // 락 획득 (DB Advisory Lock)
    await this.depositRepository.acquireDepositLock(id);

    // 1. DepositDetail 조회
    const deposit = await this.depositRepository.getById(id, {
      transaction: true,
    });

    // 2. 엔티티 비즈니스 로직 실행 (거부 처리)
    deposit.reject(failureReason, adminId);

    // 3. DepositDetail 상태 업데이트
    await this.depositRepository.update(deposit);

    return {
      userId: deposit.userId.toString(),
    };
  }
}
