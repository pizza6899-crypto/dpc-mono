import { Injectable } from '@nestjs/common';
import { DcsApiService } from '../infrastructure/dcs-api.service';
import { MessageCode, RequestClientInfo } from 'src/common/http/types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
import { IdUtil } from 'src/utils/id.util';
import { DcsResponseCode } from '../constants/dcs-response-codes';
import { toLanguageEnum } from 'src/utils/language.util';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { GameAggregatorType, Language } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CreateCasinoGameSessionService } from 'src/modules/casino-session/application/create-casino-game-session.service';
import { GetTierBenefitsService } from 'src/modules/tier/profile/application/get-tier-benefits.service';
import { Prisma } from '@prisma/client';
import { CasinoGame } from 'src/modules/casino/game-catalog/domain';
import { CasinoGameProvider } from 'src/modules/casino/aggregator/domain';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

@Injectable()
export class DcsGameService {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly dcsApiService: DcsApiService,
    private readonly createCasinoGameSessionService: CreateCasinoGameSessionService,
    private readonly getTierBenefitsService: GetTierBenefitsService,
  ) { }

  async launchGame({
    user: authUser,
    game,
    provider,
    isMobile,
    walletCurrency,
    gameCurrency,
    language,
    requestInfo,
  }: {
    user: AuthenticatedUser;
    game: CasinoGame;
    provider: CasinoGameProvider;
    isMobile: boolean;
    gameCurrency: GamingCurrencyCode;
    walletCurrency: WalletCurrencyCode;
    language?: Language;
    requestInfo: RequestClientInfo;
  }) {
    const newDcsToken = IdUtil.generateUrlSafeNanoid(32);

    try {
      const dbUser = await this.tx.user.findUnique({
        where: { id: authUser.id },
        select: {
          dcsId: true,
          language: true,
        },
      });

      if (!dbUser) {
        throw new ApiException(
          MessageCode.USER_NOT_FOUND,
          HttpStatusCode.NotFound,
        );
      }

      const dcsId = dbUser.dcsId ?? (await IdUtil.generateNextDcsId(this.tx));

      const updatedUser = await this.tx.user.update({
        where: { id: authUser.id },
        data: { dcsId },
        select: {
          dcsId: true,
          language: true,
        },
      });

      // 3. API 호출
      const response = await this.dcsApiService.loginGame({
        dcsUserId: updatedUser.dcsId!,
        dcsUserToken: newDcsToken,
        gameId: Number(game.externalGameId),
        gameCurrency: gameCurrency,
        language: language || updatedUser.language || Language.EN,
        isMobile: isMobile,
        countryCode: requestInfo.country,
        full_screen: true,
      });

      if (response.code !== DcsResponseCode.SUCCESS) {
        throw new ApiException(
          MessageCode.INTERNAL_SERVER_ERROR,
          HttpStatusCode.InternalServerError,
        );
      }

      // 4. 티어 콤프 요율 조회
      const benefits = await this.getTierBenefitsService.execute(authUser.id);
      const compRate = benefits?.compRate ?? new Prisma.Decimal(0);

      await this.createCasinoGameSessionService.execute({
        userId: authUser.id,
        gameId: game.id!,
        aggregatorType: GameAggregatorType.DC,
        walletCurrency,
        gameCurrency,
        token: newDcsToken,
        playerName: updatedUser.dcsId!,
        compRate,
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
      language: toLanguageEnum(language),
      isMobile: channel === 'mobile',
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
