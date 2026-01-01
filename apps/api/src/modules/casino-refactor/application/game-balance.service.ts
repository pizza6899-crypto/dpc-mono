// src/modules/casino-refactor/application/game-balance.service.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { WalletNotFoundException } from 'src/modules/wallet/domain';
import { Prisma } from '@repo/database';

/**
 * 게임 밸런스 서비스
 *
 * 게임 실행 시 필요한 잔액 조회 및 환율 적용 계산을 담당합니다.
 */
@Injectable()
export class GameBalanceService {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /**
   * 게임 통화로 변환된 잔액 조회
   * @param userId 사용자 ID
   * @param walletCurrency 지갑 통화
   * @param gameCurrency 게임 통화
   * @returns 게임 통화로 변환된 잔액 (number)
   */
  async getGameBalance({
    userId,
    walletCurrency,
    gameCurrency,
  }: {
    userId: bigint;
    walletCurrency: WalletCurrencyCode;
    gameCurrency: GamingCurrencyCode;
  }): Promise<number> {
    // 1. 환율 조회
    const exchangeRate = await this.exchangeRateService.getRate({
      fromCurrency: walletCurrency,
      toCurrency: gameCurrency,
    });

    // 2. 사용자 잔액 조회
    const userBalance = await this.tx.userBalance.findUnique({
      where: { userId_currency: { userId, currency: walletCurrency } },
      select: { mainBalance: true, bonusBalance: true },
    });

    if (!userBalance) {
      throw new WalletNotFoundException(userId, walletCurrency);
    }

    // 3. 환율 적용하여 게임 통화로 변환
    const balance = exchangeRate
      .mul(userBalance.mainBalance.add(userBalance.bonusBalance))
      .toDecimalPlaces(6)
      .toNumber();

    return balance;
  }

  /**
   * 사용자 잔액 조회 (환율 적용 없음)
   * @param userId 사용자 ID
   * @param currency 통화
   * @returns 메인 잔액과 보너스 잔액
   */
  async getUserBalance({
    userId,
    currency,
  }: {
    userId: bigint;
    currency: WalletCurrencyCode;
  }): Promise<{ mainBalance: Prisma.Decimal; bonusBalance: Prisma.Decimal }> {
    const userBalance = await this.tx.userBalance.findUnique({
      where: { userId_currency: { userId, currency } },
      select: { mainBalance: true, bonusBalance: true },
    });

    if (!userBalance) {
      throw new WalletNotFoundException(userId, currency);
    }

    return {
      mainBalance: userBalance.mainBalance,
      bonusBalance: userBalance.bonusBalance,
    };
  }
}

