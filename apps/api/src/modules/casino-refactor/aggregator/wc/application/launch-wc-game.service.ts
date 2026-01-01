// src/modules/casino-refactor/aggregator/wc/application/launch-wc-game.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { WC_AGGREGATOR_API } from '../ports/out/wc-aggregator-api.token';
import type { WcAggregatorApiPort } from '../ports/out/wc-aggregator-api.port';
import { RequestClientInfo } from 'src/common/http/types';
import { IdUtil } from 'src/utils/id.util';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { GameSessionService } from '../../../application/game-session.service';
import { GameBalanceService } from '../../../application/game-balance.service';
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
import { UserNotFoundException } from 'src/modules/user/domain';
import { AggregatorApiException } from 'src/modules/casino-refactor/domain';

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
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    @Inject(WC_AGGREGATOR_API)
    private readonly wcAggregatorApi: WcAggregatorApiPort,
    private readonly wcMapperService: WcMapperService,
    private readonly gameSessionService: GameSessionService,
    private readonly gameBalanceService: GameBalanceService,
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

    // 1. 사용자 정보 조회
    const userData = await this.tx.user.findUnique({
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
      throw new UserNotFoundException(user.id);
    }

    // 2. 게임 통화로 변환된 잔액 조회
    const balance = await this.gameBalanceService.getGameBalance({
      userId: user.id,
      walletCurrency,
      gameCurrency,
    });

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

      // 재시도는 하지 않고 에러 반환
      throw new AggregatorApiException(
        'WHITECLIFF',
        '/auth',
        'INVALID_USER - User registration failed',
      );
    }

    // 7. 에러 체크
    if (gameUrl.status === 0) {
      const errorMessage = (gameUrl as any).error || 'Unknown error';
      this.logger.error(`게임 실행 실패: ${errorMessage}`);
      throw new AggregatorApiException(
        'WHITECLIFF',
        '/auth',
        `Game launch failed: ${errorMessage}`,
      );
    }

    const result = gameUrl as WhitecliffGameLaunchResponse;

    // 8. whitecliffSystemId 업데이트
    if (
      userData.whitecliffSystemId == null ||
      Number(userData.whitecliffSystemId) !== result.user_id
    ) {
      await this.tx.user.update({
        where: { id: user.id },
        data: {
          whitecliffSystemId: result.user_id,
        },
      });
    }

    // 9. 게임 세션 생성
    await this.gameSessionService.createGameSession({
      userId: user.id,
      gameId,
      aggregatorType: GameAggregatorType.WHITECLIFF,
      walletCurrency,
      gameCurrency,
      token: result.sid,
    });

    return {
      gameUrl: result.launch_url,
    };
  }
}

