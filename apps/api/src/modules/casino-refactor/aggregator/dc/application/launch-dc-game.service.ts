// src/modules/casino-refactor/aggregator/dc/application/launch-dc-game.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { DC_AGGREGATOR_API } from '../ports/out/dc-aggregator-api.token';
import type { DcAggregatorApiPort } from '../ports/out/dc-aggregator-api.port';
import { MessageCode, RequestClientInfo } from 'src/common/http/types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
import { IdUtil } from 'src/utils/id.util';
import { DcsResponseCode } from 'src/modules/casino/dcs/constants/dcs-response-codes';
import { fromLanguageEnum } from 'src/utils/language.util';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { GameSessionService } from '../../../application/game-session.service';
import { GameAggregatorType } from '@repo/database';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';

interface LaunchDcGameParams {
  user: CurrentUserWithSession;
  gameId: number;
  aggregatorGameId: number;
  channel: string;
  country_code: string;
  gameCurrency: GamingCurrencyCode;
  walletCurrency: WalletCurrencyCode;
  requestInfo: RequestClientInfo;
}

interface LaunchDcGameResult {
  gameUrl: string;
}

/**
 * DC 게임 실행 Use Case
 *
 * DC 애그리게이터를 통한 게임 실행을 담당합니다.
 */
@Injectable()
export class LaunchDcGameService {
  private readonly logger = new Logger(LaunchDcGameService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(DC_AGGREGATOR_API)
    private readonly dcAggregatorApi: DcAggregatorApiPort,
    private readonly gameSessionService: GameSessionService,
  ) {}

  async execute(params: LaunchDcGameParams): Promise<LaunchDcGameResult> {
    const {
      user,
      gameId,
      aggregatorGameId,
      channel,
      country_code,
      gameCurrency,
      walletCurrency,
      requestInfo,
    } = params;

    const newDcsToken = IdUtil.generateUrlSafeNanoid(32);

    try {
      // 1. 사용자 정보 조회 및 DCS ID 생성/확인
      const { updatedUser } = await this.prismaService.$transaction(
        async (tx) => {
          const userData = await tx.user.findUnique({
            where: { id: user.id },
            select: {
              dcsId: true,
              language: true,
            },
          });

          if (!userData) {
            throw new ApiException(
              MessageCode.USER_NOT_FOUND,
              HttpStatusCode.NotFound,
            );
          }

          const dcsId = userData.dcsId ?? (await IdUtil.generateNextDcsId(tx));

          const updatedUser = await tx.user.update({
            where: { id: user.id },
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

      // 2. API 호출 (트랜잭션 밖에서 - 외부 API이므로 롤백 불가)
      const response = await this.dcAggregatorApi.loginGame({
        dcsUserId: updatedUser.dcsId!,
        dcsUserToken: newDcsToken,
        gameId: aggregatorGameId,
        gameCurrency: gameCurrency,
        language: fromLanguageEnum(updatedUser.language),
        channel: channel,
        country_code: country_code,
      });

      if (response.code !== DcsResponseCode.SUCCESS) {
        throw new ApiException(
          MessageCode.INTERNAL_SERVER_ERROR,
          HttpStatusCode.InternalServerError,
        );
      }

      // 3. 게임 세션 생성
      await this.gameSessionService.createGameSession({
        userId: user.id,
        gameId: aggregatorGameId,
        aggregatorType: GameAggregatorType.DCS,
        walletCurrency,
        gameCurrency,
        token: newDcsToken,
      });

      return {
        gameUrl: response.data.game_url,
      };
    } catch (error) {
      this.logger.error(
        error,
        `DC 게임 실행 실패: userId=${user.id}, gameId=${gameId}`,
      );
      throw error;
    }
  }
}

