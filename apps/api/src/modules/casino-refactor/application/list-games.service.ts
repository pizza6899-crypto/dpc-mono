// src/modules/casino-refactor/application/list-games.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Game } from '../domain';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import type { PaginatedData } from 'src/common/http/types';
import type { Language, GameProvider, GameCategory, GameAggregatorType } from '@repo/database';

interface ListGamesParams {
  page?: number;
  limit?: number;
  includeTranslations?: boolean;
  language?: Language;
  filters?: {
    isEnabled?: boolean;
    isVisibleToUser?: boolean;
    provider?: GameProvider;
    category?: GameCategory;
    aggregatorType?: GameAggregatorType;
  };
}

interface ListGamesResult extends PaginatedData<Game> {}

/**
 * 게임 목록 조회 Use Case (어드민용)
 *
 * 관리자가 게임 목록을 조회합니다.
 * 페이징, 필터링 기능을 지원합니다.
 */
@Injectable()
export class ListGamesService {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly repository: GameRepositoryPort,
  ) {}

  async execute(params: ListGamesParams): Promise<ListGamesResult> {
    const {
      page = 1,
      limit = 20,
      includeTranslations = false,
      language,
      filters,
    } = params;

    const offset = (page - 1) * limit;

    const games = await this.repository.findMany({
      includeTranslations,
      language,
      filters: {
        isEnabled: filters?.isEnabled,
        isVisibleToUser: filters?.isVisibleToUser,
        provider: filters?.provider,
        category: filters?.category,
        aggregatorType: filters?.aggregatorType,
      },
      limit,
      offset,
    });

    const total = await this.repository.count({
      filters: {
        isEnabled: filters?.isEnabled,
        isVisibleToUser: filters?.isVisibleToUser,
        provider: filters?.provider,
        category: filters?.category,
        aggregatorType: filters?.aggregatorType,
      },
    });

    return {
      data: games,
      page,
      limit,
      total,
    };
  }
}

