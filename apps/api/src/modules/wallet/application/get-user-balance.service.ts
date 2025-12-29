// src/modules/wallet/application/get-user-balance.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { UserWallet } from '../domain';
import type { ExchangeCurrencyCode } from '@repo/database';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

interface GetUserBalanceParams {
  userId: bigint;
  currency?: ExchangeCurrencyCode; // 없으면 모든 통화 반환
}

interface GetUserBalanceResult {
  wallet: UserWallet | UserWallet[];
}

/**
 * 사용자 잔액 조회 Use Case
 *
 * 사용자가 본인의 잔액을 조회합니다.
 * 특정 통화를 지정하면 해당 통화의 잔액만 반환하고,
 * 통화를 지정하지 않으면 모든 통화의 잔액을 반환합니다.
 */
@Injectable()
export class GetUserBalanceService {
  private readonly logger = new Logger(GetUserBalanceService.name);

  constructor(
    @Inject(USER_WALLET_REPOSITORY)
    private readonly repository: UserWalletRepositoryPort,
  ) {}

  async execute(
    params: GetUserBalanceParams,
  ): Promise<GetUserBalanceResult> {
    const { userId, currency } = params;

    try {
      if (currency) {
        // 특정 통화 조회
        let wallet = await this.repository.findByUserIdAndCurrency(
          userId,
          currency,
        );

        // 월렛이 없으면 생성
        if (!wallet) {
          const newWallet = UserWallet.create({
            userId,
            currency,
          });
          wallet = await this.repository.upsert(newWallet);
        }

        return { wallet };
      }

      // 모든 통화 반환
      const existingWallets = await this.repository.findByUserId(userId);
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
            return this.repository.upsert(newWallet);
          }),
        );

        // 기존 월렛과 새로 생성한 월렛을 합쳐서 반환
        return { wallet: [...existingWallets, ...newWallets] };
      }

      // 모든 통화가 존재하는 경우
      return { wallet: existingWallets };
    } catch (error) {
      // 예상치 못한 시스템 에러는 로깅 후 재던지기
      this.logger.error(
        `사용자 잔액 조회 실패 - userId: ${userId}, currency: ${currency || 'all'}`,
        error,
      );
      throw error;
    }
  }
}

