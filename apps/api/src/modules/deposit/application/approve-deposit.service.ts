// src/modules/deposit/application/approve-deposit.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { CreateWageringRequirementService } from 'src/modules/wagering/requirement/application';
import { GetWageringConfigService } from 'src/modules/wagering/config/application/get-wagering-config.service';
import { CreateAdminMemoService } from '../../admin-memo/application/create-admin-memo.service';
import { DepositNotFoundException } from '../domain';
import { QUEST_ENGINE_PORT } from '../ports/out/quest-engine.port';
import type { QuestEnginePort, QuestProcessResult } from '../ports/out/quest-engine.port';

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
  private readonly logger = new Logger(ApproveDepositService.name);

  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly createWageringRequirementService: CreateWageringRequirementService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly wageringConfigService: GetWageringConfigService,
    private readonly createAdminMemoService: CreateAdminMemoService,
    @Inject(QUEST_ENGINE_PORT)
    private readonly questEnginePort: QuestEnginePort,
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

    let isQuestProcessed = false;
    const appliedQuestId = deposit.providerMetadata?.appliedQuestId;

    // --- (New) 퀘스트 엔진 동기 처리 시도 ---
    let questResult: QuestProcessResult = { isSatisfied: false };
    if (appliedQuestId) {
      try {
        questResult = await this.questEnginePort.processDepositQuest({
          userId: deposit.userId,
          depositId: deposit.id!,
          questId: BigInt(appliedQuestId),
          actuallyPaid,
          currency: depositCurrency,
        });
      } catch (error) {
        this.logger.error(`Failed to evaluate quest synchronously: ${appliedQuestId} for deposit ${deposit.id}`, error);
      }
    }

    // 퀘스트가 처리된 경우: 퀘스트 결과에 따른 보상 및 웨이저링 지급
    if (questResult.isSatisfied && questResult.rewardAmount) {
      const rewardAmount = questResult.rewardAmount;
      const totalAmount = actuallyPaid.add(rewardAmount);
      const multiplier = questResult.wageringMultiplier || new Prisma.Decimal(0);

      // 1. 통합 롤링(Wagering Requirement) 생성 (QUEST 원천)
      if (multiplier.gt(0)) {
        await this.createWageringRequirementService.execute({
          userId: deposit.userId,
          currency: depositCurrency,
          sourceType: 'QUEST',
          sourceId: questResult.userQuestId!,
          calculationMethod: 'FULL',
          targetType: 'AMOUNT',
          principalAmount: totalAmount,
          multiplier: multiplier,
          bonusAmount: rewardAmount,
          initialFundAmount: totalAmount,
          realMoneyRatio: actuallyPaid.div(totalAmount),
          isForfeitable: true,
          requestInfo: requestInfo,
        });
      }

      // 2. 통합 잔액 업데이트 (입금액 + 퀘스트 보너스 합산 지급)
      await this.updateUserBalanceService.updateBalance(
        {
          userId: deposit.userId,
          currency: depositCurrency,
          amount: totalAmount,
          operation: UpdateOperation.ADD,
          balanceType: UserWalletBalanceType.BONUS, // 프로모션이므로 보너스 잔액으로 취급
          transactionType: UserWalletTransactionType.DEPOSIT,
          referenceId: deposit.id!,
        },
        {
          adminUserId: adminId,
          reasonCode: AdjustmentReasonCode.PROMOTION_REWARD,
          internalNote: memo,
          actionName: WalletActionName.QUEST_REWARD,
          metadata: {
            questId: appliedQuestId.toString(),
            depositId: deposit.id!.toString(),
            actuallyPaid: actuallyPaid.toString(),
            rewardAmount: rewardAmount.toString(),
            multiplier: multiplier.toString(),
          },
        },
      );
    }
    // 퀘스트가 적용되지 않은 경우: 기존 입금 로직 (기본 롤링 및 현금 지급)
    else {
      // --- 통합 입금 및 롤링 처리 시작 ---
      const wageringConfig = await this.wageringConfigService.execute();
      const multiplier = wageringConfig.defaultDepositMultiplier;
      const bonusAmount = new Prisma.Decimal(0);
      const totalAmount = actuallyPaid.add(bonusAmount);

      // 8. 통합 롤링(Wagering Requirement) 생성 (DEPOSIT 원천)
      await this.createWageringRequirementService.execute({
        userId: deposit.userId,
        currency: depositCurrency,
        sourceType: 'DEPOSIT',
        sourceId: deposit.id!,
        calculationMethod: 'FULL',
        targetType: 'AMOUNT',
        principalAmount: actuallyPaid,
        multiplier: multiplier,
        bonusAmount: bonusAmount,
        initialFundAmount: totalAmount,
        realMoneyRatio: totalAmount.isZero()
          ? new Prisma.Decimal(0)
          : actuallyPaid.div(totalAmount),
        isForfeitable: false,
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
            bonusAmount: bonusAmount.toString(),
            multiplier: multiplier.toString(),
          },
        },
      );
    }

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
      bonusAmount: '0',
      userId: deposit.userId.toString(),
    };
  }
}
