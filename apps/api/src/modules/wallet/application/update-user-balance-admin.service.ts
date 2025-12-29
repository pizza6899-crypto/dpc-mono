// src/modules/wallet/application/update-user-balance-admin.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import {
  UserWallet,
  InsufficientBalanceException,
  InvalidWalletBalanceException,
} from '../domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import type { ExchangeCurrencyCode } from '@repo/database';
import { Prisma } from '@repo/database';
import {
  BalanceType,
  UpdateOperation,
} from './update-user-balance.service';
import { Transactional } from '@nestjs-cls/transactional';

interface UpdateUserBalanceAdminParams {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  balanceType: BalanceType;
  operation: UpdateOperation;
  amount: Prisma.Decimal;
}

interface UpdateUserBalanceAdminResult {
  wallet: UserWallet;
  beforeMainBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
  mainBalanceChange: Prisma.Decimal;
  bonusBalanceChange: Prisma.Decimal;
}

/**
 * 관리자용 사용자 잔액 업데이트 Use Case
 *
 * 관리자가 특정 사용자의 잔액을 증가 또는 감소시킵니다.
 * 사용자 존재 여부를 검증한 후 잔액을 업데이트합니다.
 * - 메인 잔액만 업데이트
 * - 보너스 잔액만 업데이트
 * - 총 잔액에서 차감 (메인 우선, 부족하면 보너스에서 차감)
 */
@Injectable()
export class UpdateUserBalanceAdminService {
  private readonly logger = new Logger(UpdateUserBalanceAdminService.name);

  constructor(
    @Inject(USER_WALLET_REPOSITORY)
    private readonly walletRepository: UserWalletRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    params: UpdateUserBalanceAdminParams,
  ): Promise<UpdateUserBalanceAdminResult> {
    const { userId, currency, balanceType, operation, amount } = params;

    try {
      // 1. 사용자 존재 여부 확인
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // 2. 월렛 조회 (없으면 생성)
      let wallet = await this.walletRepository.findByUserIdAndCurrency(
        userId,
        currency,
      );

      if (!wallet) {
        const newWallet = UserWallet.create({
          userId,
          currency,
        });
        wallet = await this.walletRepository.upsert(newWallet);
      }

      // 3. 변경 전 잔액 저장
      const beforeMainBalance = wallet.mainBalance;
      const beforeBonusBalance = wallet.bonusBalance;

      // 4. 잔액 업데이트
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

      // 5. 저장 (Prisma가 자동으로 updatedAt 업데이트)
      const savedWallet = await this.walletRepository.upsert(wallet);

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
        error instanceof UserNotFoundException ||
        error instanceof InsufficientBalanceException ||
        error instanceof InvalidWalletBalanceException
      ) {
        throw error;
      }

      // 예상치 못한 시스템 에러는 로깅 후 재던지기
      this.logger.error(
        `관리자 사용자 잔액 업데이트 실패 - userId: ${userId}, currency: ${currency}, balanceType: ${balanceType}, operation: ${operation}, amount: ${amount}`,
        error,
      );
      throw error;
    }
  }
}

