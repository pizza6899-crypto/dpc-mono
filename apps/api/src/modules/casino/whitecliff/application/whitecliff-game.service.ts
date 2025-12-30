import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  WhitecliffApiService,
  WhitecliffGameLaunchResponse,
} from '../infrastructure/whitecliff-api.service';
import { MessageCode, RequestClientInfo } from 'src/common/http/types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
import type { ActivityLogPort } from 'src/common/activity-log/activity-log.port';
import { ACTIVITY_LOG } from 'src/common/activity-log/activity-log.token';
import { ActivityType } from 'src/common/activity-log/activity-log.types';
import { IdUtil } from 'src/utils/id.util';
import { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import {
  GameAggregatorType,
  GameCategory,
  GameProvider,
  Language,
} from '@repo/database';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { GameSessionService } from '../../application/game-session.service';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';

@Injectable()
export class WhitecliffGameService {
  private readonly logger = new Logger(WhitecliffGameService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly whitecliffApiService: WhitecliffApiService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly gameSessionService: GameSessionService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /**
   * 게임 실행 (회원가입 겸용)
   */
  async launchGame(
    authUser: CurrentUserWithSession,
    data: {
      gameId: number;
      isMobile: boolean;
      walletCurrency: WalletCurrencyCode;
      gameCurrency: GamingCurrencyCode;
    },
    requestInfo: RequestClientInfo,
  ): Promise<{ gameUrl: string }> {
    const { gameId, isMobile, walletCurrency, gameCurrency } = data;
    const token = IdUtil.generateUrlSafeNanoid(32);

    const user = await this.prismaService.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        whitecliffId: true,
        whitecliffUsername: true,
        whitecliffSystemId: true,
        language: true,
      },
    });

    if (!user) {
      throw new ApiException(
        MessageCode.USER_NOT_FOUND,
        HttpStatusCode.NotFound,
      );
    }

    const exchangeRate = await this.exchangeRateService.getRate({
      fromCurrency: walletCurrency,
      toCurrency: gameCurrency,
    });

    const userBalance = await this.prismaService.userBalance.findUnique({
      where: { userId_currency: { userId: user.id, currency: walletCurrency } },
      select: { mainBalance: true, bonusBalance: true },
    });

    if (!userBalance) {
      throw new ApiException(
        MessageCode.USER_BALANCE_NOT_FOUND,
        HttpStatusCode.NotFound,
      );
    }

    const balance = exchangeRate
      .mul(userBalance.mainBalance.add(userBalance.bonusBalance))
      .toDecimalPlaces(2)
      .toNumber();
    const whitecliffUsername = user.whitecliffUsername;

    const game = await this.prismaService.game.findUnique({
      where: { id: gameId },
      select: {
        provider: true,
        gameId: true,
        category: true,
        tableId: true,
      },
    });

    if (!game) {
      throw new ApiException(
        MessageCode.GAME_NOT_FOUND,
        HttpStatusCode.NotFound,
      );
    }

    const type = game.category === GameCategory.LIVE_CASINO ? 0 : game.gameId;

    // 에볼루션인 경우 currency에 따라 프로바이더 ID 변경
    let providerId = this.whitecliffMapperService.toWhitecliffProvider(
      game.provider,
    )!;

    if (game.provider === GameProvider.EVOLUTION) {
      if (gameCurrency === 'KRW') {
        providerId = 31;
      } else if (gameCurrency === 'IDR') {
        providerId = 29;
      } else {
        providerId = 1; // 기본값
      }
    }

    const gameUrl = await this.whitecliffApiService.launchGame({
      user: {
        id: Number(user.whitecliffId),
        language: user.language || Language.EN,
        name: whitecliffUsername || '',
        balance: balance,
        gameCurrency: gameCurrency,
        token: token,
      },
      prd: {
        id: providerId,
        type,
        table_id: game.tableId || '',
        is_mobile: isMobile,
      },
    });

    if (gameUrl.status === 0 && gameUrl.error == 'INVALID_USER') {
      const whitecliffId = await IdUtil.generateNextWhitecliffId(
        this.prismaService,
      );
      const whitecliffUsername = `wcf${whitecliffId}`;

      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          whitecliffId: whitecliffId,
          whitecliffUsername: whitecliffUsername,
          whitecliffSystemId: null,
        },
      });

      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: ActivityType.WHITECLIFF_USER_REGENERATED,
          description: '화이트 클리프 ID/이름 중복으로 인한 신규 사용자 생성',
          metadata: {
            oldWhitecliffId: user.whitecliffId,
            oldWhitecliffUsername: user.whitecliffUsername,
            oldWhitecliffSystemId: user.whitecliffSystemId,
            whitecliffId: whitecliffId,
            whitecliffUsername: whitecliffUsername,
          },
        },
        requestInfo,
      );
    }

    if (gameUrl.status === 0) {
      this.logger.error(`게임 실행 실패: ${gameUrl.error}`);
      throw new ApiException(
        MessageCode.GAME_NOT_FOUND,
        HttpStatusCode.BadRequest,
      );
    }

    const result = gameUrl as WhitecliffGameLaunchResponse;

    if (
      user.whitecliffSystemId == null ||
      Number(user.whitecliffSystemId) !== result.user_id
    ) {
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          whitecliffSystemId: result.user_id,
        },
      });
    }

    const gameSession = await this.gameSessionService.createGameSession({
      userId: user.id,
      gameId: game.gameId,
      aggregatorType: GameAggregatorType.WHITECLIFF,
      walletCurrency,
      gameCurrency,
      token: result.sid,
    });

    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.GAME_LAUNCH,
        description: '게임 실행',
        metadata: {
          ...result,
        },
      },
      requestInfo,
    );

    return {
      gameUrl: result.launch_url,
    };
  }
}
