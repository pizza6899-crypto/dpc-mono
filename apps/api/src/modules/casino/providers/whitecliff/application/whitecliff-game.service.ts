import { Injectable, Logger } from '@nestjs/common';
import {
  WhitecliffApiService,
  WhitecliffGameLaunchResponse,
} from '../infrastructure/whitecliff-api.service';
import { MessageCode, RequestClientInfo } from 'src/common/http/types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
import { IdUtil } from 'src/utils/id.util';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import {
  GameAggregatorType,
  GameProvider,
  Language,
} from '@repo/database';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CreateCasinoGameSessionService } from 'src/modules/casino/game-session/application/create-casino-game-session.service';
import { CasinoGameV2 } from 'src/modules/casino/game-catalog/domain';
import { CasinoGameProvider } from 'src/modules/casino/aggregator/domain';

@Injectable()
export class WhitecliffGameService {
  private readonly logger = new Logger(WhitecliffGameService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
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
      game: CasinoGameV2;
      provider: CasinoGameProvider;
      isMobile: boolean;
      walletCurrency: WalletCurrencyCode;
      gameCurrency: GamingCurrencyCode;
      language?: Language;
    },
    requestInfo: RequestClientInfo,
  ): Promise<{ gameUrl: string; sessionId: string }> {
    const { game, provider, isMobile, walletCurrency, gameCurrency, language } = data;
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

    const userBalance = await this.tx.userWallet.findUnique({
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

    // Whitecliff expected provider ID and game type
    // provider.code should be used to map to WC provider ID
    // game.externalGameId is the game ID in WC
    // game.tableId is used for live games

    // We need to check if provider code is an enum of GameProvider
    const providerEnum = GameProvider[provider.code as keyof typeof GameProvider];

    let wcProviderId = this.whitecliffMapperService.toWhitecliffProvider(
      providerEnum,
    )!;

    // Evolution special handling
    if (providerEnum === GameProvider.EVOLUTION) {
      if (gameCurrency === 'KRW') {
        wcProviderId = 31;
      } else if (gameCurrency === 'IDR') {
        wcProviderId = 29;
      } else {
        wcProviderId = 1; // Default
      }
    }

    const gameUrl = await this.whitecliffApiService.launchGame({
      user: {
        id: Number(user.whitecliffId),
        language: language || user.language || Language.EN,
        name: whitecliffUsername || '',
        balance: balance,
        gameCurrency: gameCurrency,
        token: token,
      },
      prd: {
        id: wcProviderId,
        type: Number(game.externalGameId), // Assuming numeric external ID for WC
        table_id: game.tableId || '',
        is_mobile: isMobile,
      },
    });

    if (gameUrl.status === 0 && gameUrl.error == 'INVALID_USER') {
      const whitecliffId = await IdUtil.generateNextWhitecliffId(this.tx);
      const newWhitecliffUsername = `wcf${whitecliffId}`;

      await this.tx.user.update({
        where: { id: user.id },
        data: {
          whitecliffId: whitecliffId,
          whitecliffUsername: newWhitecliffUsername,
          whitecliffSystemId: null,
        },
      });
      // Should ideally retry launch here or throw specific error to client to retry
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

    const session = await this.createCasinoGameSessionService.execute({
      userId: user.id,
      gameId: game.id!,
      aggregatorType: GameAggregatorType.WHITECLIFF,
      walletCurrency,
      gameCurrency,
      token: result.sid,
      playerName: whitecliffUsername!,
    });

    return {
      gameUrl: result.launch_url,
      sessionId: session.uid,
    };
  }
}
