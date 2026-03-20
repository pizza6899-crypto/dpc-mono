import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { Transactional, InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { GetUserWalletService } from 'src/modules/wallet/application/get-user-wallet.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../../requirement/ports';
import type { WageringRequirementRepositoryPort } from '../../requirement/ports';
import { SettleWageringRequirementService } from '../../requirement/application';
import type { WageringRequirement } from '../../requirement/domain';

export interface ProcessWageringWinCommand {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;
  usdExchangeRate?: Prisma.Decimal;
  referenceId: bigint;
  actionName: WalletActionName;
  metadata: Record<string, any>;
  isCancel?: boolean;
}

export interface ProcessWageringWinResult {
  cashDistributed: Prisma.Decimal;
  bonusDistributed: Prisma.Decimal;
  cashTxId?: bigint;
  bonusTxId?: bigint;
  updatedWallet: any;
}

@Injectable()
export class ProcessWageringWinService {
  private readonly logger = new Logger(ProcessWageringWinService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly getUserWalletService: GetUserWalletService,
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly requirementRepository: WageringRequirementRepositoryPort,
    private readonly settleService: SettleWageringRequirementService,
  ) {}

  @Transactional()
  async execute(command: ProcessWageringWinCommand): Promise<ProcessWageringWinResult> {
    const { userId, currency, amount, usdExchangeRate, referenceId, actionName, metadata, isCancel } = command;

    if (amount.lte(0)) {
      const wallet = await this.getUserWalletService.getWallet(userId, currency, false);
      return { cashDistributed: new Prisma.Decimal(0), bonusDistributed: new Prisma.Decimal(0), updatedWallet: wallet };
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
    
    // 원본 베팅이 아예 없는 경우는 전액 CASH로 처리 (프리 스핀 당첨 등 예외 케이스 처리용)
    let cashRatio = new Prisma.Decimal(1);
    let bonusRatio = new Prisma.Decimal(0);

    if (totalBet.gt(0)) {
      cashRatio = originalCashBet.div(totalBet);
      bonusRatio = originalBonusBet.div(totalBet);
    }

    let cashDistribution = amount.mul(cashRatio);
    let bonusDistribution = amount.mul(bonusRatio);

    // 2. 활성 웨이저링(보너스) 조건 조회
    let activeRequirements: WageringRequirement[] = [];
    if (bonusDistribution.gt(0)) {
      activeRequirements = await this.requirementRepository.findActiveByUserIdAndCurrency(userId, currency);
      
      // 만약 유저에게 활성(ACTIVE) 웨이저링 조건이 더 이상 없다면?
      // -> 베팅 이후 조건이 만료되거나 이미 롤링을 다 채워서 보너스가 현금화(COMPLETED)된 상태임.
      // -> 이 경우 뒤늦게 들어온 보너스 당첨금은 즉시 CASH로 전환해서 지급합니다.
      if (activeRequirements.length === 0) {
        this.logger.warn(`No active wagering reqs found for user ${userId}. Converting delayed bonus win ${bonusDistribution} to CASH.`);
        cashDistribution = cashDistribution.add(bonusDistribution);
        bonusDistribution = new Prisma.Decimal(0);
      }
    }

    let newCashTxId: bigint | undefined;
    let newBonusTxId: bigint | undefined;
    let updatedWallet = await this.getUserWalletService.getWallet(userId, currency, false);

    // 3. 지갑 변동 액션 타입 결정 (WIN vs CANCEL)
    const walletTxType = isCancel ? UserWalletTransactionType.REFUND : UserWalletTransactionType.WIN;

    // 4. CASH 지갑 업데이트
    if (cashDistribution.gt(0)) {
      const amountUsd = currency === 'USD' ? cashDistribution : (usdExchangeRate && !usdExchangeRate.isZero() ? cashDistribution.mul(usdExchangeRate) : undefined);
      const result = await this.updateUserBalanceService.updateBalance(
        {
          userId,
          currency,
          amount: cashDistribution,
          amountUsd,
          operation: UpdateOperation.ADD,
          balanceType: UserWalletBalanceType.CASH,
          transactionType: walletTxType,
          referenceId,
        },
        { actionName, metadata: { ...metadata, splitType: 'CASH' } as any }
      );
      updatedWallet = result.wallet;
      newCashTxId = result.txId;
    }

    // 5. BONUS 지갑 업데이트 및 도메인 엔티티 복구
    if (bonusDistribution.gt(0)) {
      const amountUsd = currency === 'USD' ? bonusDistribution : (usdExchangeRate && !usdExchangeRate.isZero() ? bonusDistribution.mul(usdExchangeRate) : undefined);
      const result = await this.updateUserBalanceService.updateBalance(
        {
          userId,
          currency,
          amount: bonusDistribution,
          amountUsd,
          operation: UpdateOperation.ADD,
          balanceType: UserWalletBalanceType.BONUS,
          transactionType: walletTxType,
          referenceId,
        },
        { actionName, metadata: { ...metadata, splitType: 'BONUS' } as any }
      );
      updatedWallet = result.wallet;
      newBonusTxId = result.txId;

      // 보너스 엔티티의 가용 잔액(currentBalance) 복구
      // 사용자가 여러 개의 보너스를 가지고 있는 시나리오에서는 우선순위가 높은 첫 번째 활성 보너스에 전액 묶는 것이 가장 안전한 복구 전략입니다.
      if (activeRequirements.length > 0) {
        const primaryReq = activeRequirements[0];
        primaryReq.recordWin(bonusDistribution);
        await this.requirementRepository.save(primaryReq);

        // ※ 참고: 취소(CANCEL) 등 특수한 경우, 롤링된 금액을 다시 깎고 싶다면 여기서 추가 로직 구현 가능.
      }
    }

    return {
      cashDistributed: cashDistribution,
      bonusDistributed: bonusDistribution,
      cashTxId: newCashTxId,
      bonusTxId: newBonusTxId,
      updatedWallet
    };
  }
}
