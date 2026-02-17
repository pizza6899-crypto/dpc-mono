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
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { UserWalletBalanceType, UserWalletTransactionType, ExchangeCurrencyCode } from '@prisma/client';
import { GrantPromotionBonusService } from '../../promotion/application/grant-promotion-bonus.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { AccumulateUserDepositService } from 'src/modules/tier/evaluator/application/accumulate-user-deposit.service';
import { CreateWageringRequirementService } from 'src/modules/wagering/requirement/application';
import { GetWageringConfigService } from 'src/modules/wagering/config/application/get-wagering-config.service';

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
    private readonly exchangeRateService: ExchangeRateService,
    private readonly accumulateUserDepositService: AccumulateUserDepositService,
    private readonly wageringConfigService: GetWageringConfigService,
  ) { }

  @Transactional()
  async execute(params: ApproveDepositParams): Promise<ApproveDepositResult> {
    const { id, actuallyPaid, transactionHash, memo, adminId, requestInfo } =
      params;

    // 락 획득 (DB Advisory Lock)
    await this.advisoryLockService.acquireLock(LockNamespace.DEPOSIT, id.toString(), {
      throwThrottleError: true,
    });

    // 1. DepositDetail 조회 (transaction 포함)
    const deposit = await this.depositRepository.getById(id, {
      bankDepositConfig: true,
    });

    // 2. 엔티티 비즈니스 로직 실행 전 검증 (이미 처리된 경우 등)
    if (!deposit.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(id, deposit.status);
    }

    // 3. Get Initial Wallet State for Recording
    const walletBefore = await this.findUserWalletService.findWallet(
      deposit.userId,
      deposit.depositCurrency as unknown as ExchangeCurrencyCode,
      true
    );

    if (!walletBefore) {
      throw new Error('User wallet not found');
    }

    const beforeTotalAmount = walletBefore.cash.add(walletBefore.bonus);

    // 4. USD 환산 산정 (티어 실적 반영용)
    const depositCurrency = deposit.depositCurrency as unknown as ExchangeCurrencyCode;
    let amountUsd = actuallyPaid;
    if (depositCurrency !== ExchangeCurrencyCode.USD) {
      const rate = await this.exchangeRateService.getRate({
        fromCurrency: depositCurrency,
        toCurrency: ExchangeCurrencyCode.USD,
      });
      amountUsd = actuallyPaid.mul(rate);
    }

    // 5. 잔액 업데이트
    const updatedWallet = await this.updateUserBalanceService.updateBalance({
      userId: deposit.userId,
      currency: depositCurrency,
      amount: actuallyPaid,
      operation: UpdateOperation.ADD,
      balanceType: UserWalletBalanceType.CASH,
      transactionType: UserWalletTransactionType.DEPOSIT,
      referenceId: deposit.id!,
      amountUsd, // 산정된 USD 금액 전달
    }, {
      adminUserId: adminId,
      reasonCode: AdjustmentReasonCode.MANUAL_DEPOSIT,
      internalNote: memo,
      actionName: WalletActionName.APPROVE_DEPOSIT,
    });

    const afterTotalAmount = updatedWallet.cash.add(updatedWallet.bonus);

    // 6. 티어 입금 실적 누적
    await this.accumulateUserDepositService.execute(deposit.userId, amountUsd.toNumber());

    // 7. Transaction 생성 (지연 생성)
    let transactionId = deposit.transactionId;
    if (!transactionId) {
      transactionId = await this.depositRepository.createTransaction({
        userId: deposit.userId,
        type: 'DEPOSIT' as any, // TransactionType 삭제됨
        status: 'COMPLETED' as any, // TransactionStatus 삭제됨
        currency: deposit.depositCurrency,
        amount: actuallyPaid,
        beforeAmount: beforeTotalAmount,
        afterAmount: afterTotalAmount,
      });
    }

    // 8. 엔티티 승인 처리 (상태 변경 및 트랜잭션 링크)
    deposit.approve(actuallyPaid, adminId, transactionHash, memo, transactionId);

    // 9. DepositDetail 상태 업데이트 (엔티티의 변경사항 반영)
    await this.depositRepository.update(deposit);

    let bonusAmount = new Prisma.Decimal(0);

    // 7. 롤링(Wagering Requirement) 처리
    if (deposit.promotionId) {
      // 7.1. 프로모션이 있는 경우: 보너스 지급 및 프로모션용 롤링 생성
      // 정책: 프로모션 롤링이 기본 입금 롤링 의무를 대체함
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
      // 7.2. 프로모션이 없는 경우: 기본 입금 롤링(AML) 생성
      const wageringConfig = await this.wageringConfigService.execute();
      await this.createWageringRequirementService.execute({
        userId: deposit.userId,
        currency: depositCurrency,
        sourceType: 'DEPOSIT',
        sourceId: deposit.id!,
        principalAmount: actuallyPaid,
        multiplier: wageringConfig.defaultDepositMultiplier,
        initialLockedCash: actuallyPaid,
        grantedBonusAmount: new Prisma.Decimal(0),
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
