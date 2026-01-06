import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  WhitecliffApiService,
  WhitecliffGameLaunchResponse,
} from '../infrastructure/whitecliff-api.service';
import { MessageCode, RequestClientInfo } from 'src/common/http/types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
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
import { CreateCasinoGameSessionService } from '../../application/create-casino-game-session.service';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { InjectTransaction, type Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class WhitecliffGameService {
  private readonly logger = new Logger(WhitecliffGameService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly whitecliffApiService: WhitecliffApiService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly createCasinoGameSessionService: CreateCasinoGameSessionService,
    private readonly exchangeRateService: ExchangeRateService,
  ) { }

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

    const user = await this.tx.user.findUnique({
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

    const userBalance = await this.tx.userBalance.findUnique({
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

    const game = await this.tx.casinoGame.findUnique({
      where: { id: gameId },
      select: {
        id: true,
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
        this.tx,
      );
      const whitecliffUsername = `wcf${whitecliffId}`;

      await this.tx.user.update({
        where: { id: user.id },
        data: {
          whitecliffId: whitecliffId,
          whitecliffUsername: whitecliffUsername,
          whitecliffSystemId: null,
        },
      });

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
      await this.tx.user.update({
        where: { id: user.id },
        data: {
          whitecliffSystemId: result.user_id,
        },
      });
    }

    const gameSession = await this.createCasinoGameSessionService.execute({
      userId: user.id,
      gameId: game.id,
      aggregatorType: GameAggregatorType.WHITECLIFF,
      walletCurrency,
      gameCurrency,
      token: result.sid,
      playerName: whitecliffUsername!,
    });

    return {
      gameUrl: result.launch_url,
    };
  }
}

