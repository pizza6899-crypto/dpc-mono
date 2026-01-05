// src/modules/wallet/application/update-user-balance.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { Transactional } from '@nestjs-cls/transactional';
import {
  UserWallet,
  WalletNotFoundException,
  InsufficientBalanceException,
  InvalidWalletBalanceException,
  WalletTransaction,
  BalanceType,
  UpdateOperation,
} from '../domain';
import type { ExchangeCurrencyCode, TransactionType, TransactionStatus } from '@repo/database';
import { Prisma } from '@repo/database';

export { BalanceType, UpdateOperation };

interface UpdateUserBalanceParams {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  balanceType: BalanceType;
  operation: UpdateOperation;
  amount: Prisma.Decimal;
}

interface UpdateUserBalanceResult {
  wallet: UserWallet;
  beforeMainBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
  mainBalanceChange: Prisma.Decimal;
  bonusBalanceChange: Prisma.Decimal;
}

/**
 * 사용자 잔액 업데이트 Use Case
 *
 * 사용자의 잔액을 증가 또는 감소시킵니다.
 * - 메인 잔액만 업데이트
 * - 보너스 잔액만 업데이트
 * - 총 잔액에서 차감 (메인 우선, 부족하면 보너스에서 차감)
 */
@Injectable()
export class UpdateUserBalanceService {
  private readonly logger = new Logger(UpdateUserBalanceService.name);

  constructor(
    @Inject(USER_WALLET_REPOSITORY)
    private readonly repository: UserWalletRepositoryPort,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: WalletTransactionRepositoryPort,
  ) { }

  @Transactional()
  async execute(
    params: UpdateUserBalanceParams,
  ): Promise<UpdateUserBalanceResult> {
    const { userId, currency, balanceType, operation, amount } = params;

    try {
      // 1. 월렛 조회/생성 (Lock 적용)
      // 먼저 Lock을 획득하여 동시성을 제어합니다.
      await this.repository.acquireLock(userId);

      let wallet = await this.repository.findByUserIdAndCurrency(
        userId,
        currency,
      );

      // 월렛이 없으면 생성 (생성 시에는 Lock 불필요, Unique Constraint가 보호)
      if (!wallet) {
        const newWallet = UserWallet.create({
          userId,
          currency,
        });
        wallet = await this.repository.upsert(newWallet);
        // 생성 후 다시 Lock을 잡아야 하는가? 생성 직후이므로 본인만 접근했을 가능성 높으나,
        // 안전을 위해 다시 로드하거나, create 자체가 원자적이므로 바로 사용.
        // 여기서는 create 리턴값을 사용.
      }

      // 3. 잔액 업데이트
      const {
        mainChange,
        bonusChange,
        beforeMainBalance,
        afterMainBalance,
        beforeBonusBalance,
        afterBonusBalance,
      } = wallet.updateBalance(balanceType, operation, amount);

      // 4. 저장 (Prisma가 자동으로 updatedAt 업데이트)
      const savedWallet = await this.repository.upsert(wallet);

      // 5. Total 계산
      const beforeTotalBalance = beforeMainBalance.add(beforeBonusBalance);
      const afterTotalBalance = afterMainBalance.add(afterBonusBalance);
      const totalChange = mainChange.add(bonusChange);

      // 6. 거래 내역 기록 (Transaction Log)
      const transactionType =
        operation === UpdateOperation.ADD
          ? ('DEPOSIT' as TransactionType)
          : ('WITHDRAW' as TransactionType);

      const transaction = WalletTransaction.create({
        userId,
        type: transactionType,
        status: 'COMPLETED' as TransactionStatus,
        currency,
        amount: totalChange, // 부호 포함
        beforeAmount: beforeTotalBalance,
        afterAmount: afterTotalBalance,
        detail: {
          mainBalanceChange: mainChange,
          mainBeforeAmount: beforeMainBalance,
          mainAfterAmount: afterMainBalance,
          bonusBalanceChange: bonusChange,
          bonusBeforeAmount: beforeBonusBalance,
          bonusAfterAmount: afterBonusBalance,
        },
      });

      await this.transactionRepository.create(transaction);

      return {
        wallet: savedWallet,
        beforeMainBalance,
        afterMainBalance,
        beforeBonusBalance,
        afterBonusBalance,
        mainBalanceChange: mainChange,
        bonusBalanceChange: bonusChange,
      };
    } catch (error) {
      // 도메인 예외는 그대로 재던지기
      if (
        error instanceof WalletNotFoundException ||
        error instanceof InsufficientBalanceException ||
        error instanceof InvalidWalletBalanceException
      ) {
        throw error;
      }

      // 예상치 못한 시스템 에러는 로깅 후 재던지기
      this.logger.error(
        `사용자 잔액 업데이트 실패 - userId: ${userId}, currency: ${currency}, balanceType: ${balanceType}, operation: ${operation}, amount: ${amount}`,
        error,
      );
      throw error;
    }
  }
}

