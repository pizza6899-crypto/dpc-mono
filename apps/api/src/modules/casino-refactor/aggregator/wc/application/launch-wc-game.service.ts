// src/modules/casino-refactor/aggregator/wc/application/launch-wc-game.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { WC_AGGREGATOR_API } from '../ports/out/wc-aggregator-api.token';
import type { WcAggregatorApiPort } from '../ports/out/wc-aggregator-api.port';
import { MessageCode, RequestClientInfo } from 'src/common/http/types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
import { IdUtil } from 'src/utils/id.util';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { GameSessionService } from '../../../application/game-session.service';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import {
  GameAggregatorType,
  GameCategory,
  GameProvider,
  Language,
} from '@repo/database';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { WcMapperService } from '../infrastructure/wc-mapper.service';
import type {
  WhitecliffGameLaunchResponse,
} from '../ports/out/wc-aggregator-api.port';

interface LaunchWcGameParams {
  user: CurrentUserWithSession;
  gameId: number;
  aggregatorGameId: number;
  provider: GameProvider;
  category: GameCategory;
  tableId: string | null;
  isMobile: boolean;
  walletCurrency: WalletCurrencyCode;
  gameCurrency: GamingCurrencyCode;
  requestInfo: RequestClientInfo;
}

interface LaunchWcGameResult {
  gameUrl: string;
}

/**
 * WC 게임 실행 Use Case
 *
 * Whitecliff 애그리게이터를 통한 게임 실행을 담당합니다.
 */
@Injectable()
export class LaunchWcGameService {
  private readonly logger = new Logger(LaunchWcGameService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(WC_AGGREGATOR_API)
    private readonly wcAggregatorApi: WcAggregatorApiPort,
    private readonly wcMapperService: WcMapperService,
    private readonly gameSessionService: GameSessionService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async execute(params: LaunchWcGameParams): Promise<LaunchWcGameResult> {
    const {
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
    } = params;

    const token = IdUtil.generateUrlSafeNanoid(32);

    try {
      // 1. 사용자 정보 조회
      const userData = await this.prismaService.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          whitecliffId: true,
          whitecliffUsername: true,
          whitecliffSystemId: true,
          language: true,
        },
      });

      if (!userData) {
        throw new ApiException(
          MessageCode.USER_NOT_FOUND,
          HttpStatusCode.NotFound,
        );
      }

      // 2. 환율 조회 및 잔액 계산
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

      const whitecliffUsername = userData.whitecliffUsername;

      // 3. 게임 타입 결정
      const type = category === GameCategory.LIVE_CASINO ? 0 : aggregatorGameId;

      // 4. 프로바이더 ID 결정
      let providerId = this.wcMapperService.toWcProvider(provider)!;

      // 에볼루션인 경우 currency에 따라 프로바이더 ID 변경
      if (provider === GameProvider.EVOLUTION) {
        if (gameCurrency === 'KRW') {
          providerId = 31;
        } else if (gameCurrency === 'IDR') {
          providerId = 29;
        } else {
          providerId = 1; // 기본값
        }
      }

      // 5. API 호출
      const gameUrl = await this.wcAggregatorApi.launchGame({
        user: {
          id: Number(userData.whitecliffId),
          language: userData.language || Language.EN,
          name: whitecliffUsername || '',
          balance: balance,
          gameCurrency: gameCurrency,
          token: token,
        },
        prd: {
          id: providerId,
          type,
          table_id: tableId || '',
          is_mobile: isMobile,
        },
      });

      // 6. 사용자 등록 처리 (INVALID_USER 에러인 경우)
      if (gameUrl.status === 0 && (gameUrl as any).error === 'INVALID_USER') {
        const whitecliffId = await IdUtil.generateNextWhitecliffId(
          this.prismaService,
        );
        const newWhitecliffUsername = `wcf${whitecliffId}`;

        await this.prismaService.user.update({
          where: { id: user.id },
          data: {
            whitecliffId: whitecliffId,
            whitecliffUsername: newWhitecliffUsername,
            whitecliffSystemId: null,
          },
        });

        // 재시도는 하지 않고 에러 반환
        throw new ApiException(
          MessageCode.INTERNAL_SERVER_ERROR,
          HttpStatusCode.InternalServerError,
        );
      }

      // 7. 에러 체크
      if (gameUrl.status === 0) {
        this.logger.error(`게임 실행 실패: ${(gameUrl as any).error}`);
        throw new ApiException(
          MessageCode.GAME_NOT_FOUND,
          HttpStatusCode.BadRequest,
        );
      }

      const result = gameUrl as WhitecliffGameLaunchResponse;

      // 8. whitecliffSystemId 업데이트
      if (
        userData.whitecliffSystemId == null ||
        Number(userData.whitecliffSystemId) !== result.user_id
      ) {
        await this.prismaService.user.update({
          where: { id: user.id },
          data: {
            whitecliffSystemId: result.user_id,
          },
        });
      }

      // 9. 게임 세션 생성
      await this.gameSessionService.createGameSession({
        userId: user.id,
        gameId: aggregatorGameId,
        aggregatorType: GameAggregatorType.WHITECLIFF,
        walletCurrency,
        gameCurrency,
        token: result.sid,
      });

      return {
        gameUrl: result.launch_url,
      };
    } catch (error) {
      this.logger.error(
        error,
        `WC 게임 실행 실패: userId=${user.id}, gameId=${gameId}`,
      );
      throw error;
    }
  }
}

