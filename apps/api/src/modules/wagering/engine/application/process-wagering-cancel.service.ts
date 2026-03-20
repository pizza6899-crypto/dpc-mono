import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { Transactional, InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { GetUserWalletService } from 'src/modules/wallet/application/get-user-wallet.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../../requirement/ports';
import type { WageringRequirementRepositoryPort } from '../../requirement/ports';
import type { WageringRequirement } from '../../requirement/domain';

export interface ProcessWageringCancelCommand {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;
  usdExchangeRate?: Prisma.Decimal;
  referenceId: bigint;
  actionName: WalletActionName;
  metadata: Record<string, any>;
}

export interface ProcessWageringCancelResult {
  cashRefunded: Prisma.Decimal;
  bonusRefunded: Prisma.Decimal;
  cashTxId?: bigint;
  bonusTxId?: bigint;
  updatedWallet: any;
}

@Injectable()
export class ProcessWageringCancelService {
  private readonly logger = new Logger(ProcessWageringCancelService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly getUserWalletService: GetUserWalletService,
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly requirementRepository: WageringRequirementRepositoryPort,
  ) { }

  @Transactional()
  async execute(command: ProcessWageringCancelCommand): Promise<ProcessWageringCancelResult> {
    const { userId, currency, amount, usdExchangeRate, referenceId, actionName, metadata } = command;

    if (amount.lte(0)) {
      const wallet = await this.getUserWalletService.getWallet(userId, currency, false);
      return { cashRefunded: new Prisma.Decimal(0), bonusRefunded: new Prisma.Decimal(0), updatedWallet: wallet };
    }

    // 1. 원본 베팅의 현금/보너스 파악 (Wallet Transaction을 조회하여 판별)
    const betTxs = await this.tx.userWalletTransaction.findMany({
      where: {
        userId,
        referenceId, // round.id
        type: UserWalletTransactionType.BET,
      },
      select: { balanceType: true, amount: true },
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

    // 원본 베팅이 아예 없는 경우는 전액 CASH로 처리 (예외 케이스 대비)
    let cashRatio = new Prisma.Decimal(1);
    let bonusRatio = new Prisma.Decimal(0);

    if (totalBet.gt(0)) {
      cashRatio = originalCashBet.div(totalBet);
      bonusRatio = originalBonusBet.div(totalBet);
    }

    let cashRefund = amount.mul(cashRatio);
    let bonusRefund = amount.mul(bonusRatio);

    // 2. 활성 웨이저링(보너스) 조건 조회
    let activeRequirements: WageringRequirement[] = [];
    if (bonusRefund.gt(0)) {
      activeRequirements = await this.requirementRepository.findActiveByUserIdAndCurrency(userId, currency);

      // 만약 정산(COMPLETED)이나 만료로 인해 활성 보너스 조건이 더 없으면 -> 롤링 깎지말고 돈만 현금으로 전액 환불
      if (activeRequirements.length === 0) {
        this.logger.warn(`No active wagering reqs found for user ${userId} during cancel. Converting bonus refund ${bonusRefund} to CASH.`);
        cashRefund = cashRefund.add(bonusRefund);
        bonusRefund = new Prisma.Decimal(0);
      }
    }

    let newCashTxId: bigint | undefined;
    let newBonusTxId: bigint | undefined;
    let updatedWallet = await this.getUserWalletService.getWallet(userId, currency, false);

    const walletTxType = UserWalletTransactionType.REFUND;

    // 3. CASH 지갑에 환불
    if (cashRefund.gt(0)) {
      const amountUsd = currency === 'USD' ? cashRefund : (usdExchangeRate && !usdExchangeRate.isZero() ? cashRefund.mul(usdExchangeRate) : undefined);
      const result = await this.updateUserBalanceService.updateBalance(
        {
          userId,
          currency,
          amount: cashRefund,
          amountUsd,
          operation: UpdateOperation.ADD,
          balanceType: UserWalletBalanceType.CASH,
          transactionType: walletTxType,
          referenceId,
        },
        { actionName, metadata: { ...metadata, splitType: 'CASH', reason: 'CANCEL_REFUND' } as any }
      );
      updatedWallet = result.wallet;
      newCashTxId = result.txId;
    }

    // 4. BONUS 지갑에 환불 및 롤링/잔액 정확히 깎기 (Reverse)
    if (bonusRefund.gt(0)) {
      const amountUsd = currency === 'USD' ? bonusRefund : (usdExchangeRate && !usdExchangeRate.isZero() ? bonusRefund.mul(usdExchangeRate) : undefined);
      const result = await this.updateUserBalanceService.updateBalance(
        {
          userId,
          currency,
          amount: bonusRefund,
          amountUsd,
          operation: UpdateOperation.ADD,
          balanceType: UserWalletBalanceType.BONUS,
          transactionType: walletTxType,
          referenceId,
        },
        { actionName, metadata: { ...metadata, splitType: 'BONUS', reason: 'CANCEL_REFUND' } as any }
      );
      updatedWallet = result.wallet;
      newBonusTxId = result.txId;

      // 4-1. 잔액(currentBalance) 복구: 가장 우선순위가 높은 첫 번째 활성 보너스에 전액 복구
      if (activeRequirements.length > 0) {
        const primaryReq = activeRequirements[0];
        primaryReq.reverseActivity(bonusRefund);
        await this.requirementRepository.save(primaryReq);
      }

      // 4-2. 롤링 기여(wageredAmount) 정밀 회수: WageringContributionLog 추적
      const logs = await this.tx.wageringContributionLog.findMany({
        where: { gameRoundId: BigInt(referenceId) },
      });

      for (const log of logs) {
        const matchingReq = await this.requirementRepository.findById(log.wageringRequirementId);
        if (matchingReq && matchingReq.isActive) {
          matchingReq.reverseContribution(log.wageredAmount, log.requestAmount);
          await this.requirementRepository.save(matchingReq);
        }
      }
    }

    return {
      cashRefunded: cashRefund,
      bonusRefunded: bonusRefund,
      cashTxId: newCashTxId,
      bonusTxId: newBonusTxId,
      updatedWallet
    };
  }
}
