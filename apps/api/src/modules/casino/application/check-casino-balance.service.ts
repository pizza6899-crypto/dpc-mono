import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetUserWalletService } from 'src/modules/wallet/application/get-user-wallet.service';
import { CasinoGameSession } from 'src/modules/casino-session/domain';
import { UserBalanceNotFoundException } from 'src/modules/casino/domain/casino.exception';

export interface CheckCasinoBalanceResult {
  balance: Prisma.Decimal;
}

@Injectable()
export class CheckCasinoBalanceService {
  private readonly logger = new Logger(CheckCasinoBalanceService.name);

  constructor(private readonly getUserWalletService: GetUserWalletService) {}

  /**
   * 특정된 세션 정보를 기반으로 유저의 카지노 잔액을 조회합니다.
   */
  async execute(session: CasinoGameSession): Promise<CheckCasinoBalanceResult> {
    // 1. 유저 지갑 조회 (세션에 지정된 walletCurrency 사용)
    const wallet = await this.getUserWalletService.getWallet(
      session.userId,
      session.walletCurrency,
    );

    // 2. 게임 통화로 환액 계산 (지갑 잔액 * 세션 내 저장된 고정 환율)
    // 세션 내 exchangeRate는 walletCurrency -> gameCurrency 비율임
    const balanceInGameCurrency = wallet.totalAvailableBalance.mul(
      session.exchangeRate,
    );

    return {
      balance: balanceInGameCurrency,
    };
  }
}
