// src/modules/casino-refactor/application/game-session.service.ts
import { Injectable } from '@nestjs/common';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import {
  GameAggregatorType,
  ExchangeCurrencyCode,
  Prisma,
} from '@repo/database';
import { GameSession } from '@repo/database';
import { nowUtc } from 'src/utils/date.util';
import { generateUid } from 'src/utils/id.util';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

/**
 * 게임 세션 서비스
 *
 * 게임 세션 생성 및 관리를 담당합니다.
 */
@Injectable()
export class GameSessionService {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /**
   * 게임 세션 생성 (환율 고정 포함)
   */
  async createGameSession(params: {
    userId: bigint;
    gameId?: number;
    aggregatorType: GameAggregatorType;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    token: string;
  }): Promise<GameSession> {
    const {
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
    return await this.tx.gameSession.create({
      data: {
        uid: generateUid(),
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

