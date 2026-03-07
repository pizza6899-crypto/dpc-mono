// src/modules/deposit/application/approve-deposit.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, AdjustmentReasonCode } from '@prisma/client';
import type { RequestClientInfo } from 'src/common/http/types';
import { DepositAlreadyProcessedException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { FindUserWalletService } from 'src/modules/wallet/application/find-user-wallet.service';
import { UpdateOperation, WalletActionName, WalletNotFoundException } from 'src/modules/wallet/domain';
import {
  UserWalletBalanceType,
  UserWalletTransactionType,
  ExchangeCurrencyCode,
} from '@prisma/client';
import { GrantPromotionBonusService } from '../../promotion/application/grant-promotion-bonus.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { CreateWageringRequirementService } from 'src/modules/wagering/requirement/application';
import { GetWageringConfigService } from 'src/modules/wagering/config/application/get-wagering-config.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
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
    private readonly findUserWalletService: FindUserWalletService,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly grantPromotionBonusService: GrantPromotionBonusService,
    private readonly createWageringRequirementService: CreateWageringRequirementService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly wageringConfigService: GetWageringConfigService,
    private readonly snowflakeService: SnowflakeService,
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

    // 3. Get Initial Wallet State for Recording
    const walletBefore = await this.findUserWalletService.findWallet(
      deposit.userId,
      deposit.depositCurrency as unknown as ExchangeCurrencyCode,
      true,
    );

    const depositCurrency = deposit.depositCurrency;

    if (!walletBefore) {
      throw new WalletNotFoundException(
        deposit.depositCurrency,
      );
    }

    // 5. Transaction ID 생성 (Snowflake) - Wallet과 Deposit이 동일한 ID 공유
    const txId = this.snowflakeService.generate();

    // 6. 잔액 업데이트
    const updatedWallet = await this.updateUserBalanceService.updateBalance(
      {
        userId: deposit.userId,
        currency: depositCurrency,
        amount: actuallyPaid,
        operation: UpdateOperation.ADD,
        balanceType: UserWalletBalanceType.CASH,
        transactionType: UserWalletTransactionType.DEPOSIT,
        txId: txId.id, // 동기화된 ID 주입
        referenceId: deposit.id!,
      },
      {
        adminUserId: adminId,
        reasonCode: AdjustmentReasonCode.MANUAL_DEPOSIT,
        internalNote: memo,
        actionName: WalletActionName.APPROVE_DEPOSIT,
      },
    );

    // 6. Tier Stats or XP Accumulation (Skip deposit-based XP if not used)
    // Deprecated: accumulateUserDepositService call removed.

    // 8. 엔티티 승인 처리 (상태 변경 및 트랜잭션 링크)
    deposit.approve(
      actuallyPaid,
      adminId,
      transactionHash,
    );

    // 9. DepositDetail 상태 업데이트 (엔티티의 변경사항 반영)
    await this.depositRepository.update(deposit);

    let bonusAmount = new Prisma.Decimal(0);

    // 7. 롤링(Wagering Requirement) 처리
    if (deposit.promotionId) {
      // 7.1. 프로모션이 있는 경우: 보너스 지급 및 프로모션용 롤링 생성
      // 정책: 프로모션 롤링이 기본 입금 롤링 의무를 대체함
      const result = await this.grantPromotionBonusService.execute({
        userId: deposit.userId,
        promotionId: deposit.promotionId,
        depositAmount: actuallyPaid,
        currency: deposit.depositCurrency,
        depositDetailId: deposit.id!,
        requestInfo,
      });
      bonusAmount = result.bonusAmount;
    } else {
      // 7.2. 프로모션이 없는 경우: 기본 입금 롤링(AML) 생성
      const wageringConfig = await this.wageringConfigService.execute();
      await this.createWageringRequirementService.execute({
        userId: deposit.userId,
        currency: depositCurrency,
        sourceType: 'DEPOSIT',
        sourceId: deposit.id!,
        targetType: 'AMOUNT',
        principalAmount: actuallyPaid,
        multiplier: new Prisma.Decimal(wageringConfig.defaultDepositMultiplier),
        bonusAmount: new Prisma.Decimal(0),
        initialFundAmount: actuallyPaid,
        realMoneyRatio: new Prisma.Decimal(1),
        isForfeitable: false,
        requestInfo: requestInfo,
      });
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
      transactionId: txId.id.toString(),
      actuallyPaid: actuallyPaid.toString(),
      bonusAmount: bonusAmount.toString(),
      userId: deposit.userId.toString(),
    };
  }
}
