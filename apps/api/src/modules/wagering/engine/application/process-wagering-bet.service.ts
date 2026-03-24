import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  WAGERING_REQUIREMENT_REPOSITORY,
  WAGERING_CONTRIBUTION_LOG_REPOSITORY,
} from '../../requirement/ports';
import type {
  WageringRequirementRepositoryPort,
  WageringContributionLogRepositoryPort,
} from '../../requirement/ports';
import { WageringPolicy } from '../../requirement/domain';
import {
  ExchangeCurrencyCode,
  Prisma,
  UserWalletBalanceType,
  UserWalletTransactionType,
} from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { GetWageringConfigService } from '../../config/application/get-wagering-config.service';
import { SettleWageringRequirementService } from '../../requirement/application/settle-wagering-requirement.service';
import { GetUserWalletService } from 'src/modules/wallet/application/get-user-wallet.service';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { WageringProgressionService } from 'src/modules/gamification/character/application/wagering-progression.service';


export interface ProcessWageringBetCommand {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  betAmount: Prisma.Decimal; // Wallet Currency Amount
  exchangeRate: Prisma.Decimal; // Wallet -> Game Currency Rate
  usdExchangeRate?: Prisma.Decimal; // Wallet -> USD Rate
  referenceId: bigint | string; // RoundId
  actionName: WalletActionName;
  metadata: Record<string, any>;
  gameContributionRate?: number;
}

export interface ProcessWageringBetResult {
  cashDeducted: Prisma.Decimal;
  bonusDeducted: Prisma.Decimal;
  cashTxId?: bigint;
  bonusTxId?: bigint;
  updatedWallet: any;
}

@Injectable()
export class ProcessWageringBetService {
  private readonly logger = new Logger(ProcessWageringBetService.name);

  constructor(
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly repository: WageringRequirementRepositoryPort,
    @Inject(WAGERING_CONTRIBUTION_LOG_REPOSITORY)
    private readonly logRepository: WageringContributionLogRepositoryPort,
    private readonly policy: WageringPolicy,
    private readonly getConfigService: GetWageringConfigService,
    private readonly settleService: SettleWageringRequirementService,
    private readonly getUserWalletService: GetUserWalletService,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly progressionService: WageringProgressionService,
  ) { }


  @Transactional()
  async execute(command: ProcessWageringBetCommand): Promise<ProcessWageringBetResult> {
    const {
      userId,
      currency,
      betAmount,
      exchangeRate,
      usdExchangeRate,
      referenceId,
      actionName,
      metadata,
      gameContributionRate = 1.0,
    } = command;

    // [CONCURRENCY FIX] Acquire user-level lock to prevent race conditions during wallet & wagering updates
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_WALLET,
      userId.toString(),
      { throwThrottleError: true },
    );


    // 1. 유저 지갑 조회
    const userWallet = await this.getUserWalletService.getWallet(
      userId,
      currency,
      false,
    );

    if (betAmount.lte(0)) {
      this.logger.warn(`[ProcessWageringBet] Zero or negative bet amount: userId=${userId}, betAmount=${betAmount}`);
      return {
        cashDeducted: new Prisma.Decimal(0),
        bonusDeducted: new Prisma.Decimal(0),
        updatedWallet: userWallet,
      };
    }

    // 2. 차감 금액 계산 (믹스벳 정책 적용: Bonus First)
    const { cashDeduction, bonusDeduction } = this.policy.calculateBalanceSplit(
      betAmount,
      { cash: userWallet.cash, bonus: userWallet.bonus },
    );

    // 3. 유저 지갑 업데이트 및 트랜잭션 기록
    let newCashTxId: bigint | undefined;
    let newBonusTxId: bigint | undefined;
    let updatedWallet = userWallet;

    // 3.1. 현금(Cash) 차감
    if (cashDeduction.gt(0)) {
      const amountUsd = currency === 'USD'
        ? cashDeduction
        : (usdExchangeRate && !usdExchangeRate.isZero() ? cashDeduction.mul(usdExchangeRate) : undefined);

      const result = await this.updateUserBalanceService.updateBalance(
        {
          userId,
          currency,
          amount: cashDeduction,
          amountUsd,
          operation: UpdateOperation.SUBTRACT,
          balanceType: UserWalletBalanceType.CASH,
          transactionType: UserWalletTransactionType.BET,
          referenceId: BigInt(referenceId),
        },
        {
          actionName,
          metadata: { ...metadata, splitType: 'CASH' } as any,
        },
      );
      updatedWallet = result.wallet;
      newCashTxId = result.txId;
    }

    // 3.2. 보너스(Bonus) 차감
    if (bonusDeduction.gt(0)) {
      const amountUsd = currency === 'USD'
        ? bonusDeduction
        : (usdExchangeRate && !usdExchangeRate.isZero() ? bonusDeduction.mul(usdExchangeRate) : undefined);

      const result = await this.updateUserBalanceService.updateBalance(
        {
          userId,
          currency,
          amount: bonusDeduction,
          amountUsd,
          operation: UpdateOperation.SUBTRACT,
          balanceType: UserWalletBalanceType.BONUS,
          transactionType: UserWalletTransactionType.BET,
          referenceId: BigInt(referenceId),
        },
        {
          actionName,
          metadata: { ...metadata, splitType: 'BONUS' } as any,
        },
      );
      updatedWallet = result.wallet;
      newBonusTxId = result.txId;
    }

    // 4. 활성 롤링 조건 조회 및 기여도 업데이트 (기본 로직 통합)
    const [config, activeRequirements] = await Promise.all([
      this.getConfigService.execute(),
      this.repository.findActiveByUserIdAndCurrency(userId, currency),
    ]);

    if (activeRequirements.length > 0) {
      const setting = config.getSetting(currency);
      const isBelowMinBet = betAmount.lessThan(setting.minBetAmount);

      // 최대 기여 한도 적용 (Capping)
      const effectiveBetForContribution =
        !setting.maxBetAmount.isZero() && betAmount.greaterThan(setting.maxBetAmount)
          ? setting.maxBetAmount
          : betAmount;

      // 가중 기여액 계산
      const weightedContribution = this.policy.calculateContribution(
        effectiveBetForContribution,
        gameContributionRate,
      );

      let remainingFullContribution = effectiveBetForContribution;
      let remainingWeightedContribution = weightedContribution;

      let remainingBonusDeduction = bonusDeduction;

      for (const requirement of activeRequirements) {
        // 이번 보너스 조건에서 실제 지출된 보너스 차감액 (현재 웨이저링 잔액 한도 내)
        const deductionForThisReq = Prisma.Decimal.min(
          remainingBonusDeduction,
          requirement.currentBalance,
        );

        // 활동 기록 (보너스 실소모액만큼 차감)
        requirement.recordActivity(deductionForThisReq);
        remainingBonusDeduction = remainingBonusDeduction.sub(deductionForThisReq);

        let contributionForThis = new Prisma.Decimal(0);
        let incrementedCount = 0;

        if (!isBelowMinBet) {
          if (requirement.targetType === 'AMOUNT') {
            const amountToContribute =
              requirement.calculationMethod === 'FULL'
                ? remainingFullContribution
                : remainingWeightedContribution;

            if (amountToContribute.gt(0)) {
              contributionForThis = requirement.contributeAmount(
                amountToContribute,
                betAmount,
              );

              if (contributionForThis.gt(0)) {
                if (requirement.calculationMethod === 'FULL') {
                  remainingFullContribution = remainingFullContribution.sub(contributionForThis);
                } else if (requirement.calculationMethod === 'WEIGHTED') {
                  remainingWeightedContribution = remainingWeightedContribution.sub(contributionForThis);
                }
              }
            }
          } else if (requirement.targetType === 'ROUND_COUNT') {
            incrementedCount = requirement.contributeRound(betAmount);
          }
        }

        await this.repository.save(requirement);

        if (contributionForThis.gt(0) || incrementedCount > 0) {
          await this.logRepository.create({
            wageringRequirementId: requirement.id,
            gameRoundId: BigInt(referenceId),
            requestAmount: betAmount,
            contributionRate: new Prisma.Decimal(
              requirement.calculationMethod === 'FULL' ? 1.0 : gameContributionRate,
            ),
            wageredAmount: contributionForThis,
          });

          if (requirement.isFulfilled) {
            try {
              await this.settleService.execute({ requirementId: requirement.id });
              // [CRITICAL FIX] 정산이 발생하면 보너스가 현금으로 전환되어 지갑 잔액이 변경되므로, 최신 상태를 갱신합니다.
              updatedWallet = await this.getUserWalletService.getWallet(userId, currency, false);
            } catch (error) {
              this.logger.error(`Failed to settle requirement ${requirement.id}`, error);
            }
          }
        }
      }
    }

    // [Gamification] 경험치(XP) 지급 연동 (USD 기반 정산)
    // 원본 통화와 환율을 기반으로 확정된 USD 가치를 전달합니다.
    const betUsd = currency === 'USD'
      ? betAmount
      : (usdExchangeRate ? betAmount.mul(usdExchangeRate) : new Prisma.Decimal(0));

    await this.progressionService.grantXpByBet(userId, betUsd, BigInt(referenceId));

    return {
      cashDeducted: cashDeduction,
      bonusDeducted: bonusDeduction,
      cashTxId: newCashTxId,
      bonusTxId: newBonusTxId,
      updatedWallet: updatedWallet,
    };
  }
}
