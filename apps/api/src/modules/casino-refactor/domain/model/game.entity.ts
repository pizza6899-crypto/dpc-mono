// src/modules/casino-refactor/domain/model/game.entity.ts
import type {
  GameAggregatorType,
  GameProvider,
  GameCategory,
  Language,
} from '@repo/database';
import { Prisma } from '@repo/database';
import { GameTranslation } from './game-translation.entity';

/**
 * Game 도메인 엔티티
 *
 * 게임 정보를 표현하는 도메인 엔티티입니다.
 * 게임의 활성화 상태, 노출 여부, 하우스 엣지, 기여율 등을 관리합니다.
 * 게임은 다국어로 번역되며, GameTranslation 엔티티와 1:N 관계를 가집니다.
 */
export class Game {
  private constructor(
    public readonly id: bigint | null,
    public readonly uid: string,
    public readonly aggregatorType: GameAggregatorType,
    public readonly provider: GameProvider,
    public readonly category: GameCategory,
    public readonly aggregatorGameId: number,
    public readonly gameType: string | null,
    public readonly tableId: string | null,
    public readonly iconLink: string | null,
    private _isEnabled: boolean,
    private _isVisibleToUser: boolean,
    private _houseEdge: Prisma.Decimal,
    private _contributionRate: Prisma.Decimal,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private _translations: GameTranslation[] = [], // 다국어 번역 정보 (선택적)
  ) {
    // 비즈니스 규칙: 하우스 엣지는 0 이상 1 미만이어야 함
    if (this._houseEdge.lt(0) || this._houseEdge.gte(1)) {
      throw new Error('House edge must be between 0 and 1');
    }
    // 비즈니스 규칙: 기여율은 0 이상이어야 함
    if (this._contributionRate.lt(0)) {
      throw new Error('Contribution rate cannot be negative');
    }
  }

  /**
   * 새로운 게임 생성
   * @param params - 게임 생성 파라미터
   * @returns 생성된 게임 엔티티
   */
  static create(params: {
    uid: string;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    category: GameCategory;
    /** 게임 애그리게이터와 통신에서 사용되는 외부 게임 식별자 */
    aggregatorGameId: number;
    gameType?: string;
    tableId?: string;
    iconLink?: string;
    isEnabled?: boolean;
    isVisibleToUser?: boolean;
    houseEdge?: Prisma.Decimal;
    contributionRate?: Prisma.Decimal;
  }): Game {
    const now = new Date();
    return new Game(
      null, // id는 DB 저장 시 자동 생성
      params.uid,
      params.aggregatorType,
      params.provider,
      params.category,
      params.aggregatorGameId,
      params.gameType ?? null,
      params.tableId ?? null,
      params.iconLink ?? null,
      params.isEnabled ?? true,
      params.isVisibleToUser ?? true,
      params.houseEdge ?? new Prisma.Decimal(0.04),
      params.contributionRate ?? new Prisma.Decimal(1.0),
      now,
      now,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    category: GameCategory;
    /** 게임 애그리게이터와 통신에서 사용되는 외부 게임 식별자 */
    aggregatorGameId: number;
    gameType: string | null;
    tableId: string | null;
    iconLink: string | null;
    isEnabled: boolean;
    isVisibleToUser: boolean;
    houseEdge: Prisma.Decimal;
    contributionRate: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
    translations?: Array<{
      id: bigint;
      gameId: bigint;
      language: Language;
      providerName: string;
      categoryName: string;
      gameName: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): Game {
    const translations =
      data.translations?.map((t) => GameTranslation.fromPersistence({ ...t, uid: data.uid })) ?? [];
    return new Game(
      data.id,
      data.uid,
      data.aggregatorType,
      data.provider,
      data.category,
      data.aggregatorGameId,
      data.gameType,
      data.tableId,
      data.iconLink,
      data.isEnabled,
      data.isVisibleToUser,
      data.houseEdge,
      data.contributionRate,
      data.createdAt,
      data.updatedAt,
      translations,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    category: GameCategory;
    /** 게임 애그리게이터와 통신에서 사용되는 외부 게임 식별자 */
    aggregatorGameId: number;
    gameType: string | null;
    tableId: string | null;
    iconLink: string | null;
    isEnabled: boolean;
    isVisibleToUser: boolean;
    houseEdge: Prisma.Decimal;
    contributionRate: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      aggregatorType: this.aggregatorType,
      provider: this.provider,
      category: this.category,
      aggregatorGameId: this.aggregatorGameId,
      gameType: this.gameType,
      tableId: this.tableId,
      iconLink: this.iconLink,
      isEnabled: this._isEnabled,
      isVisibleToUser: this._isVisibleToUser,
      houseEdge: this._houseEdge,
      contributionRate: this._contributionRate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 게임 활성화
   */
  enable(): void {
    if (this._isEnabled) {
      throw new Error('Game is already enabled');
    }
    (this as any)._isEnabled = true;
    (this as any).updatedAt = new Date();
  }

  /**
   * 게임 비활성화
   */
  disable(): void {
    if (!this._isEnabled) {
      throw new Error('Game is already disabled');
    }
    (this as any)._isEnabled = false;
    (this as any).updatedAt = new Date();
  }

  /**
   * 유저에게 게임 표시
   */
  showToUser(): void {
    if (this._isVisibleToUser) {
      throw new Error('Game is already visible to user');
    }
    (this as any)._isVisibleToUser = true;
    (this as any).updatedAt = new Date();
  }

  /**
   * 유저에게 게임 숨김
   */
  hideFromUser(): void {
    if (!this._isVisibleToUser) {
      throw new Error('Game is already hidden from user');
    }
    (this as any)._isVisibleToUser = false;
    (this as any).updatedAt = new Date();
  }

  /**
   * 게임이 플레이 가능한지 확인
   */
  canBePlayed(): boolean {
    return this._isEnabled && this._isVisibleToUser;
  }

  /**
   * 하우스 엣지 업데이트
   */
  updateHouseEdge(houseEdge: Prisma.Decimal): void {
    if (houseEdge.lt(0) || houseEdge.gte(1)) {
      throw new Error('House edge must be between 0 and 1');
    }
    (this as any)._houseEdge = houseEdge;
    (this as any).updatedAt = new Date();
  }

  /**
   * 기여율 업데이트
   */
  updateContributionRate(contributionRate: Prisma.Decimal): void {
    if (contributionRate.lt(0)) {
      throw new Error('Contribution rate cannot be negative');
    }
    (this as any)._contributionRate = contributionRate;
    (this as any).updatedAt = new Date();
  }

  // Getters
  get isEnabled(): boolean {
    return this._isEnabled;
  }

  get isVisibleToUser(): boolean {
    return this._isVisibleToUser;
  }

  get houseEdge(): Prisma.Decimal {
    return this._houseEdge;
  }

  get contributionRate(): Prisma.Decimal {
    return this._contributionRate;
  }

  /**
   * 번역 정보 추가
   */
  addTranslation(translation: GameTranslation): void {
    // 같은 언어의 번역이 이미 있는지 확인
    const existingTranslation = this._translations.find(
      (t) => t.language === translation.language,
    );
    if (existingTranslation) {
      throw new Error(
        `Translation for language ${translation.language} already exists`,
      );
    }
    // gameId 일치 확인
    if (this.id === null) {
      throw new Error('Cannot add translation to game without id');
    }
    if (translation.gameId !== this.id) {
      throw new Error('Translation gameId does not match game id');
    }
    this._translations.push(translation);
  }

  /**
   * 특정 언어의 번역 정보 가져오기
   */
  getTranslation(language: Language): GameTranslation | null {
    return (
      this._translations.find((t) => t.language === language) ?? null
    );
  }

  /**
   * 특정 언어의 번역 정보 가져오기 (없으면 예외 발생)
   */
  getTranslationOrThrow(language: Language): GameTranslation {
    const translation = this.getTranslation(language);
    if (!translation) {
      throw new Error(
        `Translation for language ${language} not found for game ${this.id}`,
      );
    }
    return translation;
  }

  /**
   * 모든 번역 정보 가져오기
   */
  getTranslations(): readonly GameTranslation[] {
    return this._translations;
  }

  /**
   * 번역 정보가 있는지 확인
   */
  hasTranslations(): boolean {
    return this._translations.length > 0;
  }

  /**
   * 특정 언어의 번역이 있는지 확인
   */
  hasTranslation(language: Language): boolean {
    return this._translations.some((t) => t.language === language);
  }

  /**
   * 번역 정보 업데이트
   */
  updateTranslation(translation: GameTranslation): void {
    const index = this._translations.findIndex(
      (t) => t.language === translation.language,
    );
    if (index === -1) {
      throw new Error(
        `Translation for language ${translation.language} not found`,
      );
    }
    // gameId 일치 확인
    if (this.id === null) {
      throw new Error('Cannot add translation to game without id');
    }
    if (translation.gameId !== this.id) {
      throw new Error('Translation gameId does not match game id');
    }
    this._translations[index] = translation;
  }

  /**
   * 번역 정보 제거
   */
  removeTranslation(language: Language): void {
    const index = this._translations.findIndex(
      (t) => t.language === language,
    );
    if (index === -1) {
      throw new Error(`Translation for language ${language} not found`);
    }
    this._translations.splice(index, 1);
  }
}

