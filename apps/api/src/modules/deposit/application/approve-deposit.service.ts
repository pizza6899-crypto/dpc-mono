// src/modules/deposit/application/approve-deposit.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, AdjustmentReasonCode } from '@prisma/client';
import type { RequestClientInfo } from 'src/common/http/types';
import { DepositAlreadyProcessedException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import {
  UserWalletBalanceType,
  UserWalletTransactionType,
} from '@prisma/client';
import { GrantPromotionBonusService } from '../../promotion/application/grant-promotion-bonus.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { CreateWageringRequirementService } from 'src/modules/wagering/requirement/application';
import { GetWageringConfigService } from 'src/modules/wagering/config/application/get-wagering-config.service';
import { CreateAdminMemoService } from '../../admin-memo/application/create-admin-memo.service';
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
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly grantPromotionBonusService: GrantPromotionBonusService,
    private readonly createWageringRequirementService: CreateWageringRequirementService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly wageringConfigService: GetWageringConfigService,
    private readonly createAdminMemoService: CreateAdminMemoService,
  ) { }

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
    deposit.approve(
      actuallyPaid,
      adminId,
      transactionHash,
    );

    // 6. DepositDetail 상태 업데이트 (엔티티의 변경사항 반영)
    await this.depositRepository.update(deposit);

    // --- 통합 입금 및 롤링 처리 시작 ---
    let bonusAmount = new Prisma.Decimal(0);
    let multiplier = new Prisma.Decimal(1); // 기본 배수
    let sourceId: bigint = deposit.id!;
    let sourceType: string = 'DEPOSIT';

    // 7. 보너스 및 배수 결정
    if (deposit.promotionId) {
      // 7.1. 프로모션이 있는 경우: 참여 기록 생성 및 보너스/배수 정보 획득
      const userPromotion = await this.grantPromotionBonusService.execute({
        userId: deposit.userId,
        promotionId: deposit.promotionId,
        depositAmount: actuallyPaid,
        currency: deposit.depositCurrency,
        depositDetailId: deposit.id!,
      });
      bonusAmount = userPromotion.bonusAmount;
      multiplier = new Prisma.Decimal(
        userPromotion.policySnapshot.wageringMultiplier ?? 1,
      );
      sourceId = userPromotion.id;
      sourceType = 'PROMOTION_BONUS';
    } else {
      // 7.2. 프로모션이 없는 경우: 기본 입금 배수(AML) 획득
      const wageringConfig = await this.wageringConfigService.execute();
      multiplier = wageringConfig.defaultDepositMultiplier;
    }

    const totalAmount = actuallyPaid.add(bonusAmount);

    // 8. 통합 롤링(Wagering Requirement) 생성
    // 정책: 입금액+보너스 전체에 대해 하나의 롤링 조건을 부여
    // 프로모션이 있으면 기중치 기반(WEIGHTED), 없으면 전액 인정(FULL)
    await this.createWageringRequirementService.execute({
      userId: deposit.userId,
      currency: depositCurrency,
      sourceType: sourceType as any,
      sourceId: sourceId,
      calculationMethod: deposit.promotionId ? 'WEIGHTED' : 'FULL',
      targetType: 'AMOUNT',
      principalAmount: actuallyPaid,
      multiplier: multiplier,
      bonusAmount: bonusAmount,
      initialFundAmount: totalAmount,
      realMoneyRatio: totalAmount.isZero()
        ? new Prisma.Decimal(0)
        : actuallyPaid.div(totalAmount),
      isForfeitable: deposit.promotionId ? true : false,
      requestInfo: requestInfo,
    });

    // 9. 통합 잔액 업데이트 (입금액 + 보너스 합산 지급)
    await this.updateUserBalanceService.updateBalance(
      {
        userId: deposit.userId,
        currency: depositCurrency,
        amount: totalAmount,
        operation: UpdateOperation.ADD,
        balanceType: UserWalletBalanceType.BONUS,
        transactionType: UserWalletTransactionType.DEPOSIT,
        referenceId: deposit.id!,
      },
      {
        adminUserId: adminId,
        reasonCode: AdjustmentReasonCode.MANUAL_DEPOSIT,
        internalNote: memo,
        actionName: WalletActionName.APPROVE_DEPOSIT,
        metadata: {
          depositId: deposit.id!.toString(),
          promotionId: deposit.promotionId?.toString(),
          bonusAmount: bonusAmount.toString(),
          multiplier: multiplier.toString(),
        },
      },
    );

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
