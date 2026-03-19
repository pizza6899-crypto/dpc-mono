import { Inject, Injectable } from '@nestjs/common';
import { GetUserWalletService } from 'src/modules/wallet/application/get-user-wallet.service';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../../requirement/ports';
import type { WageringRequirementRepositoryPort } from '../../requirement/ports';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';

export interface GetAvailableBalanceCommand {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  providerId?: string;
  category?: string;
  gameId?: string;
}

export interface GetAvailableBalanceResponse {
  totalAvailable: Prisma.Decimal;
  cash: Prisma.Decimal;
  bonus: Prisma.Decimal;
}

@Injectable()
export class GetAvailableBalanceService {
  constructor(
    private readonly getWalletService: GetUserWalletService,
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly requirementRepository: WageringRequirementRepositoryPort,
  ) { }

  /**
   * 카지노 게임 엔진 등에서 베팅 전 유효 잔액을 조회할 때 사용합니다.
   * 유저의 Cash 잔액과 해당 게임에서 사용 가능한 활성 보너스(웨이저링)의 합계를 반환합니다.
   */
  async execute(command: GetAvailableBalanceCommand): Promise<GetAvailableBalanceResponse> {
    const { userId, currency, providerId, category, gameId } = command;

    // 1. 유저 지갑(Cash) 조회
    const wallet = await this.getWalletService.getWallet(userId, currency);
    const cash = wallet.cash;

    // 2. 활성화된 모든 롤링 요구사항 조회
    const activeRequirements = await this.requirementRepository.findActiveByUserIdAndCurrency(
      userId,
      currency,
    );

    // 3. 게임 세션 필터링 및 사용 가능한 보너스 합산
    // 특정 게임이나 카테고리에서 제외된 웨이저링 조건의 잔액은 합산에서 제외함
    const effectiveBonus = activeRequirements
      .filter((req) => req.isValidForGame({ providerId, category, gameId }))
      .reduce(
        (acc, req) => acc.add(req.currentBalance),
        new Prisma.Decimal(0),
      );

    return {
      totalAvailable: cash.add(effectiveBonus),
      cash,
      bonus: effectiveBonus,
    };
  }
}
