// src/modules/casino-refactor/aggregator/dc/application/launch-dc-game.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DC_AGGREGATOR_API } from '../ports/out/dc-aggregator-api.token';
import type { DcAggregatorApiPort } from '../ports/out/dc-aggregator-api.port';
import { RequestClientInfo } from 'src/common/http/types';
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
import { UserNotFoundException } from 'src/modules/user/domain';
import { AggregatorApiException } from 'src/modules/casino-refactor/domain';

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

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
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

    // 1. 사용자 정보 조회 및 DCS ID 생성/확인
    const userData = await this.tx.user.findUnique({
      where: { id: user.id },
      select: {
        dcsId: true,
        language: true,
      },
    });

    if (!userData) {
      throw new UserNotFoundException(user.id);
    }

    const dcsId = userData.dcsId ?? (await IdUtil.generateNextDcsId(this.tx));

    const updatedUser = await this.tx.user.update({
      where: { id: user.id },
      data: { dcsId },
      select: {
        dcsId: true,
        language: true,
      },
    });

    // 2. API 호출 (외부 API이므로 실패 시 롤백되어도 외부 상태는 변경됨)
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
      throw new AggregatorApiException(
        'DCS',
        '/dcs/loginGame',
        `Response code: ${response.code}, message: ${response.msg}`,
      );
    }

    // 3. 게임 세션 생성
    await this.gameSessionService.createGameSession({
      userId: user.id,
      gameId,
      aggregatorType: GameAggregatorType.DCS,
      walletCurrency,
      gameCurrency,
      token: newDcsToken,
    });

    return {
      gameUrl: response.data.game_url,
    };
  }
}

