import { Inject, Injectable } from '@nestjs/common';
import {
  ExchangeCurrencyCode,
  GameAggregatorType,
  Prisma,
} from '@prisma/client';
import { CasinoGameSession } from '../domain';
import { CASINO_GAME_SESSION_REPOSITORY } from '../ports/casino-game-session.repository.token';
import type { CasinoGameSessionRepositoryPort } from '../ports/casino-game-session.repository.port';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';

interface CreateSessionParams {
  userId: bigint;
  gameId?: bigint;
  aggregatorType: GameAggregatorType;
  walletCurrency: ExchangeCurrencyCode;
  gameCurrency: ExchangeCurrencyCode;
  token: string;
  playerName: string;
}

import { GetTierBenefitsService } from 'src/modules/tier/profile/application/get-tier-benefits.service';

@Injectable()
export class CreateCasinoGameSessionService {
  constructor(
    @Inject(CASINO_GAME_SESSION_REPOSITORY)
    private readonly repository: CasinoGameSessionRepositoryPort,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly getTierBenefitsService: GetTierBenefitsService,
  ) {}

  async execute(params: CreateSessionParams): Promise<CasinoGameSession> {
    const {
      userId,
      gameId,
      aggregatorType,
      walletCurrency,
      gameCurrency,
      token,
      playerName,
    } = params;

    // 1. 환율 조회 (세션 고정 환율)
    const exchangeRate = await this.exchangeRateService.getRate({
      fromCurrency: walletCurrency,
      toCurrency: gameCurrency,
    });

    // 2. USD 환율 조회 (Tier Rolling 용)
    const usdExchangeRate = await this.exchangeRateService.getRate({
      fromCurrency: walletCurrency,
      toCurrency: ExchangeCurrencyCode.USD,
    });

    // 3. 유저 티어 정보 조회 (콤프 요율 적용 - Public Service 사용)
    const benefits = await this.getTierBenefitsService.execute(userId);
    const compRate = benefits?.compRate ?? new Prisma.Decimal(0);

    // 4. 도메인 엔티티 생성
    const session = CasinoGameSession.create({
      userId,
      playerName, // playername 추가
      token,
      aggregatorType,
      walletCurrency,
      gameCurrency,
      exchangeRate,
      usdExchangeRate,
      compRate,
      gameId,
    });

    // 5. 저장
    return await this.repository.create(session);
  }
}
