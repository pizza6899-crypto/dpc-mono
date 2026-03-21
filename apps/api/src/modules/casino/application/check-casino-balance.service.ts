import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CasinoGameSession } from 'src/modules/casino-session/domain';
import { CasinoGameSessionNotFoundException } from 'src/modules/casino-session/domain/casino-game-session.exception';
import { UserBalanceNotFoundException } from 'src/modules/casino/domain/casino.exception';
import { GetAvailableBalanceService } from 'src/modules/wagering/engine/application/get-available-balance.service';

export interface CheckCasinoBalanceResult {
  balance: Prisma.Decimal;
}

@Injectable()
export class CheckCasinoBalanceService {
  private readonly logger = new Logger(CheckCasinoBalanceService.name);

  constructor(
    private readonly getAvailableBalanceService: GetAvailableBalanceService,
  ) { }

  /**
   * 세션 정보를 기반으로 유저의 카지노 실시간 잔액을 조회합니다.
   * Wagering Engine을 통해 활성 보너스 잔액을 포함한 최종 가용 금액을 계산합니다.
   */
  async execute(session: CasinoGameSession): Promise<CheckCasinoBalanceResult> {
    // 1. 세션 파기 여부 우선 검증
    if (session.isRevoked) {
      this.logger.warn(`Rejected balance check for revoked session: ${session.id} (User: ${session.userId})`);
      throw new CasinoGameSessionNotFoundException(session.token);
    }

    try {
      // 2. Wagering Engine 연동 (보너스 포함 유효 잔액 계산)
      const { totalAvailable } = await this.getAvailableBalanceService.execute({
        userId: session.userId,
        currency: session.walletCurrency,
        gameId: session.gameId?.toString(),
      });

      // 3. 게임 통화 환산 (지갑 통화 -> 게임 통화)
      const balanceInGameCurrency = totalAvailable.mul(session.exchangeRate);

      return {
        balance: balanceInGameCurrency,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate available casino balance for user ${session.userId}: ${error.message}`,
        error.stack,
      );

      // 잔액 조회에 실패한 경우 도메인 수준의 예외로 응답
      throw new UserBalanceNotFoundException(session.userId, session.walletCurrency);
    }
  }
}
