// src/modules/deposit/application/approve-deposit.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, AdjustmentReasonCode } from '@repo/database';
import { TransactionStatus, TransactionType } from '@repo/database';
import type { RequestClientInfo } from 'src/common/http/types';
import { UpdateUserBalanceAdminService } from '../../wallet/application/update-user-balance-admin.service';
import { DepositAlreadyProcessedException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import { BalanceType, UpdateOperation } from 'src/modules/wallet/domain';
import { GrantPromotionBonusService } from '../../promotion/application/grant-promotion-bonus.service';
import { CreateWageringRequirementService } from '../../wagering/application/create-wagering-requirement.service';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';

interface ApproveDepositParams {
  id: bigint;
  actuallyPaid: Prisma.Decimal;
  transactionHash: string | undefined;
  memo: string | undefined;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface ApproveDepositResult {
  transactionId: string;
  actuallyPaid: string;
  bonusAmount: string;
  userId: string;
}

@Injectable()
export class ApproveDepositService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly updateUserBalanceAdminService: UpdateUserBalanceAdminService,
    private readonly grantPromotionBonusService: GrantPromotionBonusService,
    private readonly createWageringRequirementService: CreateWageringRequirementService,
    private readonly analyticsQueue: AnalyticsQueueService,
  ) { }

  @Transactional()
  async execute(params: ApproveDepositParams): Promise<ApproveDepositResult> {
    const { id, actuallyPaid, transactionHash, memo, adminId, requestInfo } =
      params;

    // 락 획득 (DB Advisory Lock)
    await this.depositRepository.acquireDepositLock(id);

    // 1. DepositDetail 조회 (transaction 포함)
    const deposit = await this.depositRepository.getById(id, {
      transaction: true,
      bankDepositConfig: true,
    });

    // 2. 엔티티 비즈니스 로직 실행 전 검증 (이미 처리된 경우 등)
    if (!deposit.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(id, deposit.status);
    }

    // 3. 잔액 업데이트
    const balanceUpdate = await this.updateUserBalanceAdminService.execute({
      userId: deposit.userId,
      currency: deposit.depositCurrency,
      balanceType: BalanceType.MAIN,
      operation: UpdateOperation.ADD,
      amount: actuallyPaid,
      adminUserId: adminId,
      reasonCode: AdjustmentReasonCode.MANUAL_DEPOSIT,
      internalNote: memo,
    });

    // 4. Transaction 생성 (지연 생성)
    let transactionId = deposit.transactionId;
    if (!transactionId) {
      transactionId = await this.depositRepository.createTransaction({
        userId: deposit.userId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        currency: deposit.depositCurrency,
        amount: actuallyPaid,
        beforeAmount: balanceUpdate.beforeMainBalance,
        afterAmount: balanceUpdate.afterMainBalance,
      });
    }

    // 5. 엔티티 승인 처리 (상태 변경 및 트랜잭션 링크)
    deposit.approve(actuallyPaid, adminId, transactionHash, memo, transactionId);

    // 6. DepositDetail 상태 업데이트 (엔티티의 변경사항 반영)
    await this.depositRepository.update(deposit);

    // --- 통계 기록 추가 ---
    await this.analyticsQueue.enqueueDeposit({
      userId: deposit.userId,
      currency: deposit.depositCurrency,
      amount: actuallyPaid,
      date: deposit.updatedAt || new Date(),
    });

    // 7. 롤링(Wagering Requirement) 처리
    let bonusAmount = new Prisma.Decimal(0);

    if (deposit.promotionId) {
      // 프로모션이 있는 경우: 보너스 지급 및 롤링 생성
      const result = await this.grantPromotionBonusService.execute({
        userId: deposit.userId,
        promotionId: deposit.promotionId!,
        depositAmount: actuallyPaid,
        currency: deposit.depositCurrency,
        depositDetailId: deposit.id!,
        requestInfo,
      });
      bonusAmount = result.bonusAmount;
    } else {
      // 프로모션이 없는 경우: 입금액의 1배 롤링 생성
      await this.createWageringRequirementService.execute({
        userId: deposit.userId,
        currency: deposit.depositCurrency,
        sourceType: 'DEPOSIT',
        requiredAmount: actuallyPaid, // 1배
        depositDetailId: deposit.id!,
        requestInfo: requestInfo,
      });
    }

    return {
      transactionId: transactionId.toString(),
      actuallyPaid: actuallyPaid.toString(),
      bonusAmount: bonusAmount.toString(),
      userId: deposit.userId.toString(),
    };
  }
}
