import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  MessageCode,
  PaginatedData,
  RequestClientInfo,
} from 'src/common/http/types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { HttpStatusCode } from 'axios';
import { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { WhitecliffGameService } from '../whitecliff/application/whitecliff-game.service';
import {
  GameAggregatorType,
  Prisma,
  GameCategory,
  GameProvider,
  Language,
} from '@repo/database';
import { DcsGameService } from '../dcs/application/dcs-game.service';
import { EnvService } from 'src/common/env/env.service';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';

export interface LaunchGameParams {
  gameId: number;
  isMobile: boolean;
  walletCurrency: WalletCurrencyCode;
  gameCurrency: GamingCurrencyCode;
}

export interface LaunchGameResult {
  gameUrl: string;
}

export interface GetGameListParams {
  category?: GameCategory[];
  keyword?: string;
  providerId?: GameProvider[];
  limit?: number;
  page?: number;
  sortBy?: 'createdAt' | 'gameName' | 'categoryName';
  sortOrder?: 'asc' | 'desc';
  language?: Language;
}

export interface GameInfo {
  gameId: bigint;
  gameName: string;
  category: GameCategory;
  provider: GameProvider;
  imageUrl: string;
}

@Injectable()
export class CasinoGameService {
  private readonly logger = new Logger(CasinoGameService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly whitecliffGameService: WhitecliffGameService,
    private readonly dcsGameService: DcsGameService,
    private readonly envService: EnvService,
  ) { }

  /**
   * 게임 실행 (애그리게이터 자동 선택)
   */
  async launchGame(
    authUser: CurrentUserWithSession,
    params: LaunchGameParams,
    requestInfo: RequestClientInfo,
  ): Promise<LaunchGameResult> {
    const { gameId, isMobile, walletCurrency, gameCurrency } = params;

    // 게임 정보 조회 (aggregatorType 포함)
    const game = await this.prismaService.casinoGame.findUnique({
      where: { id: gameId },
      select: {
        aggregatorType: true,
      },
    });

    if (!game) {
      throw new ApiException(
        MessageCode.GAME_NOT_FOUND,
        HttpStatusCode.NotFound,
      );
    }

    switch (game.aggregatorType) {
      case GameAggregatorType.WHITECLIFF:
        return await this.whitecliffGameService.launchGame(
          authUser,
          params,
          requestInfo,
        );
      case GameAggregatorType.DCS:
        return await this.dcsGameService.launchGame({
          requestInfo,
          userId: authUser.id,
          gameId: gameId,
          channel: isMobile ? 'mobile' : 'pc',
          country_code: requestInfo.country,
          gameCurrency: gameCurrency,
          walletCurrency: walletCurrency,
        });
    }
  }

  async getGameList(
    query: GetGameListParams,
  ): Promise<PaginatedData<GameInfo>> {
    const {
      category,
      keyword,
      providerId,
      limit = 30,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      language = Language.EN,
    } = query;

    // Where 조건 구성
    const where: Prisma.CasinoGameTranslationWhereInput = {
      language,
      casinoGame: {
        isEnabled: true, // 활성화된 게임만 조회
        isVisibleToUser: true, // 유저에게 표시 가능한 게임만 조회
        ...(category && category.length > 0 && { category: { in: category } }),
        ...(providerId &&
          providerId.length > 0 && { provider: { in: providerId } }),
      },
      ...(keyword && {
        gameName: {
          contains: keyword,
          mode: 'insensitive',
        },
      }),
    };

    // 정렬 조건 구성
    const orderBy: Prisma.CasinoGameTranslationOrderByWithRelationInput = (() => {
      switch (sortBy) {
        case 'gameName':
          return { gameName: sortOrder };
        case 'categoryName':
          return { categoryName: sortOrder };
        case 'createdAt':
        default:
          return { createdAt: sortOrder };
      }
    })();

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 데이터 조회
    const games = await this.prismaService.casinoGameTranslation.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        gameName: true,
        casinoGame: {
          select: {
            id: true,
            iconLink: true,
            aggregatorType: true,
            provider: true,
            category: true,
          },
        },
      },
    });

    // 전체 개수 조회
    const total = await this.prismaService.casinoGameTranslation.count({ where });

    // 응답 데이터 매핑
    const data: GameInfo[] = games.map((game) => {
      const baseUrl = this.envService.app.staticAssetsBaseUrl || '/static';
      const iconLink = game.casinoGame.iconLink || '';

      // 이미 전체 URL이면 그대로 사용, 상대 경로면 baseUrl 추가
      let imageUrl = iconLink;
      if (iconLink && !iconLink.startsWith('http')) {
        // 상대 경로인 경우 baseUrl 추가
        imageUrl = iconLink.startsWith('/')
          ? `${baseUrl}${iconLink}`
          : `${baseUrl}/${iconLink}`;
      }

      return {
        gameId: game.casinoGame.id,
        gameName: game.gameName,
        category: game.casinoGame.category,
        provider: game.casinoGame.provider,
        imageUrl: imageUrl || '',
      };
    });

    return {
      data,
      page,
      limit,
      total,
    };
  }
}
