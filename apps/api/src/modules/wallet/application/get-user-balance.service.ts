// src/modules/wallet/application/get-user-balance.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WalletQueryService } from './wallet-query.service';
import { UserWallet, WalletNotFoundException } from '../domain';
import type { ExchangeCurrencyCode } from '@prisma/client';

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
    private readonly walletQueryService: WalletQueryService,
  ) { }

  async execute(
    params: GetUserBalanceParams,
  ): Promise<GetUserBalanceResult> {
    const { userId, currency } = params;

    try {
      if (currency) {
        // 특정 통화 조회
        const wallet = await this.walletQueryService.getWallet(userId, currency, false);

        if (!wallet) {
          throw new WalletNotFoundException(userId, currency);
        }

        return { wallet };
      }

      // 모든 통화 반환
      const wallets = await this.walletQueryService.getWallets(userId, false);
      return { wallet: wallets };
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

