import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  ExchangeCurrencyCode,
  GameAggregatorType,
  Prisma,
} from '@prisma/client';
import { CasinoGameSession } from '../domain';
import { CASINO_GAME_SESSION_REPOSITORY } from '../ports/casino-game-session.repository.token';
import type { CasinoGameSessionRepositoryPort } from '../ports/casino-game-session.repository.port';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';

interface CreateSessionParams {
  userId: bigint;
  gameId?: bigint;
  aggregatorType: GameAggregatorType;
  walletCurrency: ExchangeCurrencyCode;
  gameCurrency: ExchangeCurrencyCode;
  token: string;
  playerName: string;
  compRate: Prisma.Decimal;
}

@Injectable()
export class CreateCasinoGameSessionService {
  constructor(
    @Inject(CASINO_GAME_SESSION_REPOSITORY)
    private readonly repository: CasinoGameSessionRepositoryPort,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly lockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute(params: CreateSessionParams): Promise<CasinoGameSession> {
    const {
      userId,
      gameId,
      aggregatorType,
      walletCurrency,
      gameCurrency,
      token,
      playerName,
      compRate,
    } = params;

    // 1. 동시성 제어를 위한 락 획득 (유저 + 어그리게이터 단위)
    await this.lockService.acquireLock(
      LockNamespace.CASINO_SESSION,
      `${userId}:${aggregatorType}`,
    );

    // 2. 기존 세션 파기 (동일 어그리게이터 대상)
    await this.repository.revokeByUserId(userId, userId, aggregatorType);

    // 3. 환율 조회 (세션 고정 환율)
    const exchangeRate = await this.exchangeRateService.getRate({
      fromCurrency: walletCurrency,
      toCurrency: gameCurrency,
    });

    // 4. USD 환율 조회 (Tier Rolling 용)
    const usdExchangeRate = await this.exchangeRateService.getRate({
      fromCurrency: walletCurrency,
      toCurrency: ExchangeCurrencyCode.USD,
    });

    // 5. 도메인 엔티티 생성
    const session = CasinoGameSession.create({
      userId,
      playerName,
      token,
      aggregatorType,
      walletCurrency,
      gameCurrency,
      exchangeRate,
      usdExchangeRate,
      compRate,
      gameId,
    });

    // 6. 저장
    return await this.repository.create(session);
  }
}
