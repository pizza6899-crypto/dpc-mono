import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

import {
  WAGERING_REQUIREMENT_REPOSITORY,
  WAGERING_CONTRIBUTION_LOG_REPOSITORY
} from '../../requirement/ports';
import type {
  WageringRequirementRepositoryPort,
  WageringContributionLogRepositoryPort
} from '../../requirement/ports';
import { USER_WALLET_TRANSACTION_REPOSITORY } from 'src/modules/wallet/ports/out/user-wallet-transaction.repository.token';
import type { UserWalletTransactionRepositoryPort } from 'src/modules/wallet/ports/out/user-wallet-transaction.repository.port';

export interface RevertWageringContributionCommand {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;        // 취소(푸쉬) 금액
  referenceId: bigint;           // 게임 라운드 ID
}

export interface RevertWageringContributionResult {
  success: boolean;
  bonusReverted: Prisma.Decimal;
}

@Injectable()
export class RevertWageringContributionService {
  private readonly logger = new Logger(RevertWageringContributionService.name);

  constructor(
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly requirementRepository: WageringRequirementRepositoryPort,
    @Inject(WAGERING_CONTRIBUTION_LOG_REPOSITORY)
    private readonly logRepository: WageringContributionLogRepositoryPort,
    @Inject(USER_WALLET_TRANSACTION_REPOSITORY)
    private readonly walletTxRepository: UserWalletTransactionRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 베팅 후 일부 또는 전체가 푸쉬/무효화 되었을 때,
   * 사용자의 지갑 잔액은 건드리지 않고 오직 "롤링 기여도(Wagering Contribution)"만 
   * 역산하여 초기화하는 사후 보정 전용 서비스입니다.
   */
  @Transactional()
  async execute(command: RevertWageringContributionCommand): Promise<RevertWageringContributionResult> {
    const { userId, currency, amount, referenceId } = command;

    if (amount.lte(0)) {
      return { success: true, bonusReverted: new Prisma.Decimal(0) };
    }

    // 1. 유저 락 획득 (Wagering Requirement 동시 접근 차단)
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_WALLET,
      userId.toString(),
      { throwThrottleError: true },
    );

    // 2. 원본 베팅의 보너스 사용 비율 파악
    const [betTxs] = await this.walletTxRepository.listByUserId({
      userId,
      referenceId,
      type: UserWalletTransactionType.BET,
      page: 1,
      limit: 100,
    });

    let originalCashBet = new Prisma.Decimal(0);
    let originalBonusBet = new Prisma.Decimal(0);

    for (const tx of betTxs) {
      if (tx.balanceType === UserWalletBalanceType.CASH) {
        originalCashBet = originalCashBet.add(tx.amount.abs());
      } else if (tx.balanceType === UserWalletBalanceType.BONUS) {
        originalBonusBet = originalBonusBet.add(tx.amount.abs());
      }
    }

    const totalBet = originalCashBet.add(originalBonusBet);
    let bonusRatio = new Prisma.Decimal(0);
    let revertRatio = new Prisma.Decimal(1);

    if (totalBet.gt(0)) {
      bonusRatio = originalBonusBet.div(totalBet);
      revertRatio = amount.div(totalBet); // 전체 베팅 중 현재 취소(푸쉬)되는 금액의 비율
    }

    // 실제 취소해야 하는 보너스 금액 분량
    const bonusRevertAmount = amount.mul(bonusRatio);

    if (bonusRevertAmount.lte(0)) {
      this.logger.debug(`No bonus revert needed for user ${userId}, round ${referenceId}`);
      return { success: true, bonusReverted: new Prisma.Decimal(0) };
    }

    const activeRequirements = await this.requirementRepository.findActiveByUserIdAndCurrency(userId, currency);

    // 3. 롤링 조건(Requirement) 잔액 역산
    if (activeRequirements.length > 0) {
      const primaryReq = activeRequirements[0];
      // 베팅으로 차감되었던 보너스 활성 잔액 복구
      primaryReq.reverseActivity(bonusRevertAmount);
      await this.requirementRepository.save(primaryReq);
    } else {
      this.logger.warn(`No active wagering reqs found to revert rolling for user ${userId}. Revert applies only to logs if any.`);
    }

    // 4. WageringContributionLog 롤링 달성액 정밀 회수
    // (부분 환불일 경우 revertRatio 만큼만 깎아야 함)
    const logs = await this.logRepository.findByGameRoundId(BigInt(referenceId));

    for (const log of logs) {
      const matchingReq = await this.requirementRepository.findById(log.wageringRequirementId);
      if (matchingReq && matchingReq.isActive) {
        const revertWagered = log.wageredAmount.mul(revertRatio);
        const revertRequest = log.requestAmount.mul(revertRatio);
        
        matchingReq.reverseContribution(revertWagered, revertRequest);
        await this.requirementRepository.save(matchingReq);
      }
    }

    this.logger.log(`Wagering rolling reverted for user ${userId}, round ${referenceId}, bonus amount ${bonusRevertAmount}, ratio ${revertRatio.toNumber()}`);

    return { 
      success: true, 
      bonusReverted: bonusRevertAmount 
    };
  }
}
