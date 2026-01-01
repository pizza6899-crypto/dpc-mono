// src/modules/casino-refactor/application/launch-game.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import { GameNotFoundException } from '../domain/exception';
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
import { DcsGameService } from 'src/modules/casino/dcs/application/dcs-game.service';
import { WhitecliffGameService } from 'src/modules/casino/whitecliff/application/whitecliff-game.service';

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
  ) {}

  async execute(params: LaunchGameParams): Promise<LaunchGameResult> {
    const { user, gameUid, isMobile, walletCurrency, gameCurrency, requestInfo } = params;

    // 1. 게임 정보 조회
    const game = await this.gameRepository.getByUid(gameUid);

    // 2. 게임이 플레이 가능한지 확인
    if (!game.canBePlayed()) {
      throw new ApiException(
        MessageCode.GAME_NOT_FOUND,
        HttpStatusCode.NotFound,
      );
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
        this.logger.error(
          `Unsupported aggregator type: ${game.aggregatorType}`,
        );
        throw new ApiException(
          MessageCode.INTERNAL_SERVER_ERROR,
          HttpStatusCode.InternalServerError,
        );
    }
  }

  private async launchDcsGame(params: {
    user: CurrentUserWithSession;
    game: any;
    isMobile: boolean;
    walletCurrency: WalletCurrencyCode;
    gameCurrency: GamingCurrencyCode;
    requestInfo: RequestClientInfo;
  }): Promise<LaunchGameResult> {
    const { user, game, isMobile, walletCurrency, gameCurrency, requestInfo } = params;

    // 게임 ID는 DB의 id를 사용 (기존 casino 모듈과 동일)
    const gameId = game.id ? Number(game.id) : null;
    if (!gameId) {
      throw new ApiException(
        MessageCode.GAME_NOT_FOUND,
        HttpStatusCode.NotFound,
      );
    }

    // const result = await this.dcsGameService.launchGame({
    //   userId: user.id,
    //   gameId,
    //   channel: isMobile ? 'mobile' : 'pc',
    //   country_code: requestInfo.country || 'XX',
    //   gameCurrency,
    //   walletCurrency,
    //   requestInfo,
    // });

    return {
      gameUrl: result.gameUrl,
    };
  }

  private async launchWhitecliffGame(params: {
    user: CurrentUserWithSession;
    game: any;
    isMobile: boolean;
    walletCurrency: WalletCurrencyCode;
    gameCurrency: GamingCurrencyCode;
    requestInfo: RequestClientInfo;
  }): Promise<LaunchGameResult> {
    const { user, game, isMobile, walletCurrency, gameCurrency, requestInfo } = params;

    // 게임 ID는 DB의 id를 사용 (기존 casino 모듈과 동일)
    const gameId = game.id ? Number(game.id) : null;
    if (!gameId) {
      throw new ApiException(
        MessageCode.GAME_NOT_FOUND,
        HttpStatusCode.NotFound,
      );
    }

    // const result = await this.whitecliffGameService.launchGame(
    //   user,
    //   {
    //     gameId,
    //     isMobile,
    //     walletCurrency,
    //     gameCurrency,
    //   },
    //   requestInfo,
    // );

    return {
      gameUrl: result.gameUrl,
    };
  }
}

