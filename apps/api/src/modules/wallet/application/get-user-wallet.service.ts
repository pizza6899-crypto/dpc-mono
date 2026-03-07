import { Inject, Injectable } from '@nestjs/common';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { UserWallet, WalletNotFoundException } from '../domain';
import { ExchangeCurrencyCode } from '@prisma/client';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

@Injectable()
export class GetUserWalletService {
  constructor(
    @Inject(USER_WALLET_REPOSITORY)
    private readonly repository: UserWalletRepositoryPort,
  ) { }

  /**
   * 단일 통화 지갑 가져오기 (없으면 생성하거나 예외 발생)
   * @param autoCreate 존재하지 않을 경우 생성 여부 (false일 경우 없으면 예외 발생)
   * @throws {WalletNotFoundException} 지갑을 찾을 수 없고 생성이 불가능할 때
   */
  async getWallet(
    userId: bigint,
    currency: ExchangeCurrencyCode,
    autoCreate: boolean = true,
  ): Promise<UserWallet> {
    let wallet = await this.repository.findByUserIdAndCurrency(
      userId,
      currency,
    );

    if (!wallet && autoCreate) {
      const newWallet = UserWallet.create({
        userId,
        currency,
      });
      wallet = await this.repository.create(newWallet);
    }

    if (!wallet) {
      throw new WalletNotFoundException(currency);
    }

    return wallet;
  }

  /**
   * 전체 통화 지갑 가져오기 (없으면 생성)
   * @param autoCreate 존재하지 않는 통화의 지갑 자동 생성 여부
   */
  async getWallets(
    userId: bigint,
    autoCreate: boolean = true,
  ): Promise<UserWallet[]> {
    const existingWallets = await this.repository.findByUserId(userId);

    if (!autoCreate) {
      return existingWallets;
    }

    // 존재하는 통화 목록 확인
    const existingCurrencies = new Set(existingWallets.map((w) => w.currency));

    // 누락된 통화 확인 (WALLET_CURRENCIES 기준)
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
          return this.repository.create(newWallet);
        }),
      );

      return [...existingWallets, ...newWallets];
    }

    return existingWallets;
  }
}
