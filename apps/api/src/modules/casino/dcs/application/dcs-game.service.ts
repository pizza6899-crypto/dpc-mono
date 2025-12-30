import { Inject, Injectable } from '@nestjs/common';
import { DcsApiService } from '../infrastructure/dcs-api.service';
import { MessageCode, RequestClientInfo } from 'src/common/http/types';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
import { IdUtil } from 'src/utils/id.util';
import { DcsResponseCode } from '../constants/dcs-response-codes';
import { fromLanguageEnum, toLanguageEnum } from 'src/utils/language.util';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { GameSessionService } from '../../application/game-session.service';
import { GameAggregatorType } from '@repo/database';

@Injectable()
export class DcsGameService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dcsApiService: DcsApiService,
    private readonly gameSessionService: GameSessionService,
  ) {}

  async launchGame({
    userId,
    gameId,
    channel,
    country_code,
    full_screen,
    gameCurrency,
    walletCurrency,
    requestInfo,
  }: {
    userId: bigint;
    gameId: number;
    channel: string;
    country_code: string;
    full_screen?: boolean;
    gameCurrency: GamingCurrencyCode;
    walletCurrency: WalletCurrencyCode;
    requestInfo: RequestClientInfo;
  }) {
    const newDcsToken = IdUtil.generateUrlSafeNanoid(32);

    try {
      const { updatedUser } = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: {
              dcsId: true,
              language: true,
            },
          });

          if (!user) {
            throw new ApiException(
              MessageCode.USER_NOT_FOUND,
              HttpStatusCode.NotFound,
            );
          }

          const dcsId = user.dcsId ?? (await IdUtil.generateNextDcsId(tx));

          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { dcsId },
            select: {
              dcsId: true,
              language: true,
            },
          });

          return {
            updatedUser,
          };
        },
      );

      const game = await this.prismaService.game.findUnique({
        where: { id: gameId },
        select: {
          gameId: true,
        },
      });

      if (!game) {
        throw new ApiException(
          MessageCode.GAME_NOT_FOUND,
          HttpStatusCode.NotFound,
        );
      }

      // 3. API 호출 (트랜잭션 밖에서 - 외부 API이므로 롤백 불가)
      const response = await this.dcsApiService.loginGame({
        dcsUserId: updatedUser.dcsId!,
        dcsUserToken: newDcsToken,
        gameId: game.gameId,
        gameCurrency: gameCurrency,
        language: fromLanguageEnum(updatedUser.language),
        channel: channel,
        country_code: country_code == 'XX' ? 'JP' : country_code,
        full_screen: full_screen,
      });

      if (response.code !== DcsResponseCode.SUCCESS) {

        throw new ApiException(
          MessageCode.INTERNAL_SERVER_ERROR,
          HttpStatusCode.InternalServerError,
        );
      }

      const gameSession = await this.gameSessionService.createGameSession({
        userId,
        gameId: game.gameId,
        aggregatorType: GameAggregatorType.DCS,
        walletCurrency,
        gameCurrency,
        token: newDcsToken,
      });


      return {
        gameUrl: response.data.game_url,
      };
    } catch (error) {

      throw error;
    }
  }

  async launchDemoGame({
    gameId,
    gameCurrency,
    language,
    channel,
    full_screen,
  }: {
    gameId: number;
    gameCurrency: GamingCurrencyCode;
    language: string;
    channel: string;
    full_screen?: boolean;
  }) {
    const response = await this.dcsApiService.tryGame({
      gameId: gameId,
      gameCurrency: gameCurrency,
      language: fromLanguageEnum(toLanguageEnum(language)),
      channel: channel,
      full_screen: full_screen,
    });

    if (response.code !== DcsResponseCode.SUCCESS) {
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatusCode.InternalServerError,
      );
    }

    return {
      gameUrl: response.data.game_url,
    };
  }
}
