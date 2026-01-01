// src/modules/casino-refactor/application/update-game-translation.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Game, GameTranslation } from '../domain';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import type { Language } from '@repo/database';

interface UpdateGameTranslationParams {
  gameUid: string;
  language: Language;
  providerName?: string;
  categoryName?: string;
  gameName?: string;
}

/**
 * 게임 번역 정보 업데이트 Use Case (어드민용)
 *
 * 관리자가 게임 번역 정보를 업데이트합니다.
 */
@Injectable()
export class UpdateGameTranslationService {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly repository: GameRepositoryPort,
  ) {}

  async execute(params: UpdateGameTranslationParams): Promise<GameTranslation> {
    const game = await this.repository.getByUid(params.gameUid, {
      includeTranslations: true,
    });

    const translation = game.getTranslationOrThrow(params.language);

    const updateData: {
      providerName?: string;
      categoryName?: string;
      gameName?: string;
    } = {};

    if (params.providerName !== undefined) {
      updateData.providerName = params.providerName;
    }
    if (params.categoryName !== undefined) {
      updateData.categoryName = params.categoryName;
    }
    if (params.gameName !== undefined) {
      updateData.gameName = params.gameName;
    }

    translation.update(updateData);

    return await this.repository.saveTranslation(translation);
  }
}

