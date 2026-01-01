// src/modules/casino-refactor/application/update-game.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Game } from '../domain';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import { Prisma } from '@repo/database';

interface UpdateGameParams {
  gameUid: string;
  gameType?: string | null;
  tableId?: string | null;
  iconLink?: string | null;
  isEnabled?: boolean;
  isVisibleToUser?: boolean;
  houseEdge?: number | string;
  contributionRate?: number | string;
}

/**
 * 게임 정보 업데이트 Use Case (어드민용)
 *
 * 관리자가 게임 정보를 업데이트합니다.
 */
@Injectable()
export class UpdateGameService {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly repository: GameRepositoryPort,
  ) {}

  async execute(params: UpdateGameParams): Promise<Game> {
    const game = await this.repository.getByUid(params.gameUid);

    const updateData: {
      gameType?: string | null;
      tableId?: string | null;
      iconLink?: string | null;
      isEnabled?: boolean;
      isVisibleToUser?: boolean;
      houseEdge?: Prisma.Decimal;
      contributionRate?: Prisma.Decimal;
    } = {};

    if (params.gameType !== undefined) {
      updateData.gameType = params.gameType;
    }
    if (params.tableId !== undefined) {
      updateData.tableId = params.tableId;
    }
    if (params.iconLink !== undefined) {
      updateData.iconLink = params.iconLink;
    }
    if (params.isEnabled !== undefined) {
      updateData.isEnabled = params.isEnabled;
    }
    if (params.isVisibleToUser !== undefined) {
      updateData.isVisibleToUser = params.isVisibleToUser;
    }
    if (params.houseEdge !== undefined) {
      updateData.houseEdge = new Prisma.Decimal(params.houseEdge);
    }
    if (params.contributionRate !== undefined) {
      updateData.contributionRate = new Prisma.Decimal(params.contributionRate);
    }

    game.update(updateData);

    return await this.repository.save(game);
  }
}

