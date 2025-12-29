// src/modules/wallet/application/update-user-balance.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import {
  UserWallet,
  WalletNotFoundException,
  InsufficientBalanceException,
  InvalidWalletBalanceException,
} from '../domain';
import type { ExchangeCurrencyCode } from '@repo/database';
import { Prisma } from '@repo/database';

export enum BalanceType {
  MAIN = 'main',
  BONUS = 'bonus',
  TOTAL = 'total', // 메인 우선, 부족하면 보너스에서 차감
}

export enum UpdateOperation {
  ADD = 'add',
  SUBTRACT = 'subtract',
}

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
  ) {}

  async execute(
    params: UpdateUserBalanceParams,
  ): Promise<UpdateUserBalanceResult> {
    const { userId, currency, balanceType, operation, amount } = params;

    try {
      // 1. 월렛 조회 (없으면 생성)
      let wallet = await this.repository.findByUserIdAndCurrency(
        userId,
        currency,
      );

      if (!wallet) {
        const newWallet = UserWallet.create({
          userId,
          currency,
        });
        wallet = await this.repository.upsert(newWallet);
      }

      // 2. 변경 전 잔액 저장
      const beforeMainBalance = wallet.mainBalance;
      const beforeBonusBalance = wallet.bonusBalance;

      // 3. 잔액 업데이트
      if (operation === UpdateOperation.ADD) {
        if (balanceType === BalanceType.MAIN) {
          wallet.addMainBalance(amount);
        } else if (balanceType === BalanceType.BONUS) {
          wallet.addBonusBalance(amount);
        } else {
          // TOTAL은 ADD 시 메인 잔액에 추가
          wallet.addMainBalance(amount);
        }
      } else {
        // SUBTRACT
        if (balanceType === BalanceType.MAIN) {
          wallet.subtractMainBalance(amount);
        } else if (balanceType === BalanceType.BONUS) {
          wallet.subtractBonusBalance(amount);
        } else {
          // TOTAL: 메인 우선, 부족하면 보너스에서 차감
          wallet.subtractFromTotal(amount);
        }
      }

      // 4. 저장 (Prisma가 자동으로 updatedAt 업데이트)
      const savedWallet = await this.repository.upsert(wallet);

      // 6. 변경량 계산
      const mainBalanceChange = savedWallet.mainBalance.sub(beforeMainBalance);
      const bonusBalanceChange = savedWallet.bonusBalance.sub(
        beforeBonusBalance,
      );

      return {
        wallet: savedWallet,
        beforeMainBalance,
        afterMainBalance: savedWallet.mainBalance,
        beforeBonusBalance,
        afterBonusBalance: savedWallet.bonusBalance,
        mainBalanceChange,
        bonusBalanceChange,
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

