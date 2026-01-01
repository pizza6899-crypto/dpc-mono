// src/modules/casino-refactor/application/launch-game.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import { GameAggregatorType } from '@repo/database';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { HttpStatusCode } from 'axios';
import type {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import type { RequestClientInfo } from 'src/common/http/types';
import {
  GameNotEnabledException,
  GameNotVisibleException,
  GameNotFoundException,
} from '../domain/exception';
import { LaunchDcGameService } from '../aggregator/dc/application/launch-dc-game.service';
import { LaunchWcGameService } from '../aggregator/wc/application/launch-wc-game.service';
import { Game } from '../domain';

interface LaunchGameParams {
  user: CurrentUserWithSession;
  gameUid: string;
  isMobile: boolean;
  walletCurrency: WalletCurrencyCode;
  gameCurrency: GamingCurrencyCode;
  requestInfo: RequestClientInfo;
}

interface LaunchGameResult {
  gameUrl: string;
}

/**
 * 게임 실행 Use Case (유저용)
 *
 * 유저가 게임을 실행할 때 호출됩니다.
 * 게임 정보를 조회하고, 애그리게이터 타입에 따라 적절한 서비스를 호출합니다.
 */
@Injectable()
export class LaunchGameService {
  private readonly logger = new Logger(LaunchGameService.name);

  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: GameRepositoryPort,
    private readonly launchDcGameService: LaunchDcGameService,
    private readonly launchWcGameService: LaunchWcGameService,
  ) {}

  async execute(params: LaunchGameParams): Promise<LaunchGameResult> {
    const { user, gameUid, isMobile, walletCurrency, gameCurrency, requestInfo } = params;

    // 1. 게임 정보 조회
    const game = await this.gameRepository.getByUid(gameUid);

    // 2. 게임이 플레이 가능한지 확인 (도메인 규칙 검증)
    if (!game.isEnabled) {
      const gameId = game.id ? Number(game.id) : 0;
      throw new GameNotEnabledException(gameId);
    }

    if (!game.isVisibleToUser) {
      const gameId = game.id ? Number(game.id) : 0;
      throw new GameNotVisibleException(gameId);
    }

    // 3. 애그리게이터 타입에 따라 분기 처리
    switch (game.aggregatorType) {
      case GameAggregatorType.DCS:
        return await this.launchDcsGame({
          user,
          game,
          isMobile,
          walletCurrency,
          gameCurrency,
          requestInfo,
        });

      case GameAggregatorType.WHITECLIFF:
        return await this.launchWhitecliffGame({
          user,
          game,
          isMobile,
          walletCurrency,
          gameCurrency,
          requestInfo,
        });

      default:
        throw new ApiException(
          MessageCode.INTERNAL_SERVER_ERROR,
          HttpStatusCode.InternalServerError,
        );
    }
  }

  private async launchDcsGame(params: {
    user: CurrentUserWithSession;
    game: Game;
    isMobile: boolean;
    walletCurrency: WalletCurrencyCode;
    gameCurrency: GamingCurrencyCode;
    requestInfo: RequestClientInfo;
  }): Promise<LaunchGameResult> {
    const { user, game, isMobile, walletCurrency, gameCurrency, requestInfo } = params;

    // 게임 ID는 DB의 id를 사용 (기존 casino 모듈과 동일)
    // 게임은 이미 조회되었으므로 id가 null일 수 없음 (도메인 규칙 위반)
    if (!game.id) {
      throw new GameNotFoundException(game.uid);
    }

    const gameId = Number(game.id);
    const aggregatorGameId = game.aggregatorGameId;

    return await this.launchDcGameService.execute({
      user,
      gameId,
      aggregatorGameId,
      channel: isMobile ? 'mobile' : 'pc',
      country_code: requestInfo.country || 'XX',
      gameCurrency,
      walletCurrency,
      requestInfo,
    });
  }

  private async launchWhitecliffGame(params: {
    user: CurrentUserWithSession;
    game: Game;
    isMobile: boolean;
    walletCurrency: WalletCurrencyCode;
    gameCurrency: GamingCurrencyCode;
    requestInfo: RequestClientInfo;
  }): Promise<LaunchGameResult> {
    const { user, game, isMobile, walletCurrency, gameCurrency, requestInfo } = params;

    // 게임 ID는 DB의 id를 사용 (기존 casino 모듈과 동일)
    // 게임은 이미 조회되었으므로 id가 null일 수 없음 (도메인 규칙 위반)
    if (!game.id) {
      throw new GameNotFoundException(game.uid);
    }

    const gameId = Number(game.id);
    const aggregatorGameId = game.aggregatorGameId;
    const provider = game.provider;
    const category = game.category;
    const tableId = game.tableId;

    return await this.launchWcGameService.execute({
      user,
      gameId,
      aggregatorGameId,
      provider,
      category,
      tableId,
      isMobile,
      walletCurrency,
      gameCurrency,
      requestInfo,
    });
  }
}

