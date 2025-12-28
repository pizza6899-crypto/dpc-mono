// src/modules/casino/application/game-session.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import {
  GameAggregatorType,
  ExchangeCurrencyCode,
  Prisma,
} from '@repo/database';
import { GameSession } from '@repo/database';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class GameSessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /**
   * 게임 세션 생성 (환율 고정 포함)
   */
  async createGameSession(params: {
    tx?: Prisma.TransactionClient;
    userId: string;
    gameId?: number;
    aggregatorType: GameAggregatorType;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    token: string;
  }): Promise<GameSession> {
    const {
      tx = this.prismaService,
      userId,
      gameId,
      aggregatorType,
      walletCurrency,
      gameCurrency,
      token,
    } = params;

    // 1. 환율 조회
    const exchangeRate = await this.exchangeRateService.getRate({
      fromCurrency: walletCurrency,
      toCurrency: gameCurrency,
    });

    // 2. GameSession 생성
    return await tx.gameSession.create({
      data: {
        userId,
        aggregatorType,
        walletCurrency,
        gameCurrency,
        exchangeRate,
        exchangeRateSnapshotAt: nowUtc(),
        token,
        ...(gameId && { gameId }),
      },
    });
  }
}
