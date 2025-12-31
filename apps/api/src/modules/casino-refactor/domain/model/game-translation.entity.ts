// src/modules/casino-refactor/domain/model/game-translation.entity.ts
import type { Language } from '@repo/database';

/**
 * GameTranslation 도메인 엔티티
 *
 * 게임의 다국어 번역 정보를 표현하는 도메인 엔티티입니다.
 * Game과 1:N 관계로 여러 언어의 번역을 관리합니다.
 */
export class GameTranslation {
  private constructor(
    public readonly id: number | null,
    public readonly gameId: number,
    public readonly language: Language,
    private _providerName: string,
    private _categoryName: string,
    private _gameName: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    // 비즈니스 규칙: 게임명은 비어있을 수 없음
    if (!this._gameName || this._gameName.trim().length === 0) {
      throw new Error('Game name cannot be empty');
    }
    if (!this._providerName || this._providerName.trim().length === 0) {
      throw new Error('Provider name cannot be empty');
    }
    if (!this._categoryName || this._categoryName.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
  }

  /**
   * 새로운 게임 번역 생성
   * @param params - 게임 번역 생성 파라미터
   * @returns 생성된 게임 번역 엔티티
   */
  static create(params: {
    gameId: number;
    language: Language;
    providerName: string;
    categoryName: string;
    gameName: string;
  }): GameTranslation {
    const now = new Date();
    return new GameTranslation(
      null, // id는 DB 저장 시 자동 생성
      params.gameId,
      params.language,
      params.providerName,
      params.categoryName,
      params.gameName,
      now,
      now,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: number;
    gameId: number;
    language: Language;
    providerName: string;
    categoryName: string;
    gameName: string;
    createdAt: Date;
    updatedAt: Date;
  }): GameTranslation {
    return new GameTranslation(
      data.id,
      data.gameId,
      data.language,
      data.providerName,
      data.categoryName,
      data.gameName,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    gameId: number;
    language: Language;
    providerName: string;
    categoryName: string;
    gameName: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      gameId: this.gameId,
      language: this.language,
      providerName: this._providerName,
      categoryName: this._categoryName,
      gameName: this._gameName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 게임명 업데이트
   */
  updateGameName(gameName: string): void {
    if (!gameName || gameName.trim().length === 0) {
      throw new Error('Game name cannot be empty');
    }
    (this as any)._gameName = gameName;
    (this as any).updatedAt = new Date();
  }

  /**
   * 프로바이더명 업데이트
   */
  updateProviderName(providerName: string): void {
    if (!providerName || providerName.trim().length === 0) {
      throw new Error('Provider name cannot be empty');
    }
    (this as any)._providerName = providerName;
    (this as any).updatedAt = new Date();
  }

  /**
   * 카테고리명 업데이트
   */
  updateCategoryName(categoryName: string): void {
    if (!categoryName || categoryName.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    (this as any)._categoryName = categoryName;
    (this as any).updatedAt = new Date();
  }

  // Getters
  get providerName(): string {
    return this._providerName;
  }

  get categoryName(): string {
    return this._categoryName;
  }

  get gameName(): string {
    return this._gameName;
  }
}

