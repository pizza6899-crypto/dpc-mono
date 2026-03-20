import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CasinoGameSession } from 'src/modules/casino-session/domain';
import { GetAvailableBalanceService } from 'src/modules/wagering/engine/application/get-available-balance.service';


export interface CheckCasinoBalanceResult {
  balance: Prisma.Decimal;
}

@Injectable()
export class CheckCasinoBalanceService {
  private readonly logger = new Logger(CheckCasinoBalanceService.name);

  constructor(private readonly getAvailableBalanceService: GetAvailableBalanceService) {}


  /**
   * 특정된 세션 정보를 기반으로 유저의 카지노 잔액을 조회합니다.
   */
  async execute(session: CasinoGameSession): Promise<CheckCasinoBalanceResult> {
    // 1. 유효 잔액 조회 (현금 + 활성화된 보너스 중 해당 게임에서 사용 가능한 금액 합산)
    const engineBalanceResult = await this.getAvailableBalanceService.execute({
      userId: session.userId,
      currency: session.walletCurrency,
      providerId: session.aggregatorType, // 게임 카탈로그나 세션에서 provider 정보 (예: WHITECLIFF, DCS 등)
      gameId: session.gameId?.toString(),
    });

    // 2. 게임 통화로 환산 (지갑 단위 금액 * 환율)
    const balanceInGameCurrency = engineBalanceResult.totalAvailable.mul(
      session.exchangeRate,
    );

    return {
      balance: balanceInGameCurrency,
    };
  }
}
