// src/modules/wallet/application/get-user-balance-admin.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { UserWallet } from '../domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import type { ExchangeCurrencyCode } from '@repo/database';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

interface GetUserBalanceAdminParams {
  userId: bigint;
  currency?: ExchangeCurrencyCode; // 없으면 모든 통화 반환
}

interface GetUserBalanceAdminResult {
  wallet: UserWallet | UserWallet[];
}

/**
 * 관리자용 사용자 잔액 조회 Use Case
 *
 * 관리자가 특정 사용자의 잔액을 조회합니다.
 * 사용자 존재 여부를 검증한 후 잔액을 조회합니다.
 * 특정 통화를 지정하면 해당 통화의 잔액만 반환하고,
 * 통화를 지정하지 않으면 모든 통화의 잔액을 반환합니다.
 */
@Injectable()
export class GetUserBalanceAdminService {
  private readonly logger = new Logger(GetUserBalanceAdminService.name);

  constructor(
    @Inject(USER_WALLET_REPOSITORY)
    private readonly walletRepository: UserWalletRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    params: GetUserBalanceAdminParams,
  ): Promise<GetUserBalanceAdminResult> {
    const { userId, currency } = params;

    try {
      // 1. 사용자 존재 여부 확인
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // 2. 잔액 조회 (기존 로직과 동일)
      if (currency) {
        // 특정 통화 조회
        let wallet = await this.walletRepository.findByUserIdAndCurrency(
          userId,
          currency,
        );

        // 월렛이 없으면 생성
        if (!wallet) {
          const newWallet = UserWallet.create({
            userId,
            currency,
          });
          wallet = await this.walletRepository.upsert(newWallet);
        }

        return { wallet };
      }

      // 모든 통화 반환
      const existingWallets = await this.walletRepository.findByUserId(userId);
      const existingCurrencies = new Set(
        existingWallets.map((w) => w.currency),
      );

      // WALLET_CURRENCIES에 있는 통화 중 누락된 것이 있으면 생성
      const missingCurrencies = WALLET_CURRENCIES.filter(
        (c) => !existingCurrencies.has(c),
      );

      if (missingCurrencies.length > 0) {
        const newWallets = await Promise.all(
          missingCurrencies.map((c) => {
            const newWallet = UserWallet.create({
              userId,
              currency: c,
            });
            return this.walletRepository.upsert(newWallet);
          }),
        );

        // 기존 월렛과 새로 생성한 월렛을 합쳐서 반환
        return { wallet: [...existingWallets, ...newWallets] };
      }

      // 모든 통화가 존재하는 경우
      return { wallet: existingWallets };
    } catch (error) {
      // 도메인 예외는 그대로 재던지기
      if (error instanceof UserNotFoundException) {
        throw error;
      }

      // 예상치 못한 시스템 에러는 로깅 후 재던지기
      this.logger.error(
        `관리자 사용자 잔액 조회 실패 - userId: ${userId}, currency: ${currency || 'all'}`,
        error,
      );
      throw error;
    }
  }
}

