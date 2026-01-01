// src/modules/casino-refactor/application/list-playable-games.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Game } from '../domain';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import type { PaginatedData } from 'src/common/http/types';
import type { Language, GameProvider, GameCategory } from '@repo/database';

interface ListPlayableGamesParams {
  page?: number;
  limit?: number;
  includeTranslations?: boolean;
  language?: Language;
  filters?: {
    provider?: GameProvider;
    category?: GameCategory;
  };
}

interface ListPlayableGamesResult extends PaginatedData<Game> {}

/**
 * 플레이 가능한 게임 목록 조회 Use Case (유저용)
 *
 * 유저가 플레이할 수 있는 게임 목록을 조회합니다.
 * isEnabled && isVisibleToUser 조건을 자동으로 적용합니다.
 */
@Injectable()
export class ListPlayableGamesService {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly repository: GameRepositoryPort,
  ) {}

  async execute(params: ListPlayableGamesParams): Promise<ListPlayableGamesResult> {
    const {
      page = 1,
      limit = 30,
      includeTranslations = true,
      language,
      filters,
    } = params;

    const offset = (page - 1) * limit;

    const games = await this.repository.findMany({
      includeTranslations,
      language,
      filters: {
        isEnabled: true, // 플레이 가능한 게임만
        isVisibleToUser: true, // 유저에게 보이는 게임만
        provider: filters?.provider,
        category: filters?.category,
      },
      limit,
      offset,
    });

    const total = await this.repository.count({
      filters: {
        isEnabled: true,
        isVisibleToUser: true,
        provider: filters?.provider,
        category: filters?.category,
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

