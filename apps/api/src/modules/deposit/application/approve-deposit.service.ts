// src/modules/deposit/application/approve-deposit.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, AdjustmentReasonCode } from '@prisma/client';
import type { RequestClientInfo } from 'src/common/http/types';
import { DepositAlreadyProcessedException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/deposit-detail.repository.port';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { CreateAdminMemoService } from '../../admin-memo/application/create-admin-memo.service';
import { ProcessDepositPromotionService } from '../../promotion/campaign/application/process-deposit-promotion.service';
import { DepositNotFoundException } from '../domain';

interface ApproveDepositParams {
  id: bigint;
  actuallyPaid: Prisma.Decimal;
  transactionHash: string | undefined;
  memo: string | undefined;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface ApproveDepositResult {
  actuallyPaid: string;
  bonusAmount: string;
  userId: string;
}

@Injectable()
export class ApproveDepositService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly processDepositPromotionService: ProcessDepositPromotionService,
    private readonly createAdminMemoService: CreateAdminMemoService,
  ) {}

  @Transactional()
  async execute(params: ApproveDepositParams): Promise<ApproveDepositResult> {
    const { id, actuallyPaid, transactionHash, memo, adminId, requestInfo } =
      params;

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

    // 2. 엔티티 비즈니스 로직 실행 전 검증 (이미 처리된 경우 등)
    if (!deposit.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(deposit.status);
    }

    const depositCurrency = deposit.depositCurrency;

    // 5. 엔티티 승인 처리 (상태 변경 및 메타데이터 업데이트)
    deposit.approve(actuallyPaid, adminId, transactionHash);

    // 6. DepositDetail 상태 업데이트 (엔티티의 변경사항 반영)
    await this.depositRepository.update(deposit);

    // --- 프로모션 및 롤링 후처리 위임 (Promotion Module) ---
    const { bonusAmount } = await this.processDepositPromotionService.execute({
      userId: deposit.userId,
      depositId: deposit.id!,
      amount: actuallyPaid,
      currency: depositCurrency,
      promotionId: deposit.promotionId ?? undefined,
      adminId: adminId,
      memo: memo,
      requestInfo: requestInfo,
    });

    // 10. 관리자 메모 저장 (트랜잭션 편입)
    if (memo) {
      await this.createAdminMemoService.execute({
        adminId,
        content: memo,
        target: { type: 'DEPOSIT', id },
      });
    }

    return {
      actuallyPaid: actuallyPaid.toString(),
      bonusAmount: bonusAmount.toString(),
      userId: deposit.userId.toString(),
    };
  }
}
