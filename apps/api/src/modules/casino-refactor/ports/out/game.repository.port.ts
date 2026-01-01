// src/modules/casino-refactor/ports/out/game.repository.port.ts
import type { Game, GameTranslation } from '../../domain';
import type { Language } from '@repo/database';

export interface GameRepositoryPort {
  /**
   * 게임 생성
   */
  create(
    game: Game,
    translations?: Array<{
      uid: string;
      language: Language;
      providerName: string;
      categoryName: string;
      gameName: string;
    }>,
  ): Promise<Game>;

  /**
   * UID로 게임 조회
   */
  findByUid(uid: string, options?: { includeTranslations?: boolean; language?: Language }): Promise<Game | null>;

  /**
   * UID로 게임 조회 (없으면 예외 발생)
   */
  getByUid(uid: string, options?: { includeTranslations?: boolean; language?: Language }): Promise<Game>;

  /**
   * ID로 게임 조회 (어드민 전용)
   */
  findById(id: bigint, options?: { includeTranslations?: boolean; language?: Language }): Promise<Game | null>;

  /**
   * ID로 게임 조회 (없으면 예외 발생, 어드민 전용)
   */
  getById(id: bigint, options?: { includeTranslations?: boolean; language?: Language }): Promise<Game>;

  /**
   * 게임 목록 조회
   */
  findMany(options?: {
    includeTranslations?: boolean;
    language?: Language;
    filters?: {
      isEnabled?: boolean;
      isVisibleToUser?: boolean;
      provider?: string;
      category?: string;
      aggregatorType?: string;
    };
    limit?: number;
    offset?: number;
  }): Promise<Game[]>;

  /**
   * 게임 개수 조회
   */
  count(options?: {
    filters?: {
      isEnabled?: boolean;
      isVisibleToUser?: boolean;
      provider?: string;
      category?: string;
      aggregatorType?: string;
    };
  }): Promise<number>;

  /**
   * 게임 저장
   */
  save(game: Game): Promise<Game>;

  /**
   * 게임 번역 저장
   */
  saveTranslation(translation: GameTranslation): Promise<GameTranslation>;

  /**
   * 게임 번역 생성
   */
  createTranslation(translation: GameTranslation): Promise<GameTranslation>;
}
