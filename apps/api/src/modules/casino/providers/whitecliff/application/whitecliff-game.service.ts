import { Injectable, Logger } from '@nestjs/common';
import {
  WhitecliffApiService,
  WhitecliffGameLaunchResponse,
} from '../infrastructure/whitecliff-api.service';
import { type RequestClientInfo } from 'src/common/http/types';
import { IdUtil } from 'src/utils/id.util';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import { WalletNotFoundException } from 'src/modules/wallet/domain/wallet.exception';
import { GameProvider, Language, GameAggregatorType } from '@prisma/client';
import { CasinoGameProviderNotFoundException } from 'src/modules/casino/aggregator/domain/casino-aggregator.exception';
import { GameNotFoundException } from 'src/modules/casino/game-catalog/domain';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CreateCasinoGameSessionService } from 'src/modules/casino/game-session/application/create-casino-game-session.service';
import { CasinoGame } from 'src/modules/casino/game-catalog/domain';
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
  ) {}

  /**
   * 게임 실행 (회원가입 겸용)
   */
  async launchGame(
    authUser: CurrentUserWithSession,
    data: {
      game: CasinoGame;
      provider: CasinoGameProvider;
      isMobile: boolean;
      walletCurrency: WalletCurrencyCode;
      gameCurrency: GamingCurrencyCode;
      language?: Language;
    },
    requestInfo: RequestClientInfo,
  ): Promise<{ gameUrl: string }> {
    const { game, provider, isMobile, walletCurrency, gameCurrency, language } =
      data;

    // 1. 사용자 및 잔액 정보 조회 (데이터 무결성 확인)
    const [user, userBalance, exchangeRate] = await Promise.all([
      this.tx.user.findUnique({
        where: { id: authUser.id },
        select: {
          id: true,
          whitecliffId: true,
          whitecliffUsername: true,
          whitecliffSystemId: true,
          language: true,
        },
      }),
      this.tx.userWallet.findUnique({
        where: {
          userId_currency: { userId: authUser.id, currency: walletCurrency },
        },
        select: { cash: true, bonus: true },
      }),
      this.exchangeRateService.getRate({
        fromCurrency: walletCurrency,
        toCurrency: gameCurrency,
      }),
    ]);

    if (!user) throw new UserNotFoundException(authUser.id);
    if (!userBalance)
      throw new WalletNotFoundException(authUser.id, walletCurrency);

    const balance = exchangeRate
      .mul(userBalance.cash.add(userBalance.bonus))
      .toDecimalPlaces(2)
      .toNumber();

    // 2. Provider 매핑
    const providerEnum =
      GameProvider[provider.code as keyof typeof GameProvider];
    const wcProviderId =
      this.whitecliffMapperService.toWhitecliffProviderWithCurrency(
        providerEnum,
        gameCurrency,
      );

    if (!wcProviderId) {
      throw new CasinoGameProviderNotFoundException(provider.code);
    }

    // 3. Whitecliff Identity 확보 (지연된 온보딩 지원)
    let identity = await this.ensureWhitecliffIdentity(user);
    const token = IdUtil.generateUrlSafeNanoid(32);

    // 4. 게임 실행 시도 (최대 2회 - INVALID_USER 대응)
    let apiResponse = await this.whitecliffApiService.launchGame({
      user: {
        id: Number(identity.id),
        language: language || user.language || Language.EN,
        name: identity.username,
        balance,
        gameCurrency,
        token,
      },
      prd: {
        id: wcProviderId,
        type: Number(game.externalGameId),
        table_id: game.tableId || '',
        is_mobile: isMobile,
      },
    });

    // INVALID_USER 에러 시 ID 재생성 후 1회 재시도
    if (apiResponse.status === 0 && apiResponse.error === 'INVALID_USER') {
      this.logger.warn(
        `Whitecliff INVALID_USER (wcid: ${identity.id}). Regenerating identity for ${user.id}...`,
      );
      identity = await this.regenerateWhitecliffIdentity(user.id);

      apiResponse = await this.whitecliffApiService.launchGame({
        user: {
          id: Number(identity.id),
          language: language || user.language || Language.EN,
          name: identity.username,
          balance,
          gameCurrency,
          token,
        },
        prd: {
          id: wcProviderId,
          type: Number(game.externalGameId),
          table_id: game.tableId || '',
          is_mobile: isMobile,
        },
      });
    }

    // 최종 결과 확인
    if (apiResponse.status === 0) {
      this.logger.error(`Whitecliff Game Launch Failed: ${apiResponse.error}`, {
        userId: user.id,
        gameId: game.id,
      });
      throw new GameNotFoundException(game.id!);
    }

    const result = apiResponse as WhitecliffGameLaunchResponse;

    // 5. Whitecliff 연동 정보 동기화 (필요한 경우에만 1회 업데이트)
    if (
      !user.whitecliffSystemId ||
      Number(user.whitecliffSystemId) !== result.user_id
    ) {
      await this.tx.user.update({
        where: { id: user.id },
        data: { whitecliffSystemId: result.user_id },
      });
    }

    // 6. 게임 세션 생성 (애플리케이션 레이어 위임)
    await this.createCasinoGameSessionService.execute({
      userId: user.id,
      gameId: game.id!,
      aggregatorType: GameAggregatorType.WHITECLIFF,
      walletCurrency,
      gameCurrency,
      token: result.sid,
      playerName: identity.username,
    });

    return { gameUrl: result.launch_url };
  }

  /**
   * 사용자의 Whitecliff 식별 정보를 확보합니다.
   * 누락된 경우 즉시 생성하여 DB에 반영합니다.
   */
  private async ensureWhitecliffIdentity(user: {
    id: bigint;
    whitecliffId: bigint | null;
    whitecliffUsername: string | null;
  }): Promise<{ id: bigint; username: string }> {
    if (user.whitecliffId && user.whitecliffUsername) {
      return { id: user.whitecliffId, username: user.whitecliffUsername };
    }
    return this.regenerateWhitecliffIdentity(user.id);
  }

  /**
   * 사용자의 Whitecliff 식별 정보를 새로 생성하고 DB에 반영합니다.
   * 기존 연동 정보(System ID)가 있다면 초기화합니다.
   */
  private async regenerateWhitecliffIdentity(
    userId: bigint,
  ): Promise<{ id: bigint; username: string }> {
    const nextId = await IdUtil.generateNextWhitecliffId(this.tx);
    const username = `wcf${nextId}`;

    await this.tx.user.update({
      where: { id: userId },
      data: {
        whitecliffId: nextId,
        whitecliffUsername: username,
        whitecliffSystemId: null, // 초기화
      },
    });

    return { id: nextId, username: username };
  }
}
