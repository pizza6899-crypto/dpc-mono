/**
 * [History] 점수 변화 이력 엔티티
 */
export class UserIntelligenceHistory {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint,
    private readonly _prevTotalScore: number,
    private readonly _nextTotalScore: number,
    private readonly _reason: string | null,
    private readonly _createdAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티로 복원
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint;
    prevTotalScore: number;
    nextTotalScore: number;
    reason: string | null;
    createdAt: Date;
  }): UserIntelligenceHistory {
    return new UserIntelligenceHistory(
      data.id,
      data.userId,
      data.prevTotalScore,
      data.nextTotalScore,
      data.reason,
      data.createdAt,
    );
  }

  /**
   * 새로운 이력 생성 (Snowflake ID와 해당 시점의 타임스탬프를 반드시 포함해야 함)
   */
  static create(params: {
    id: bigint;
    userId: bigint;
    prevTotalScore: number;
    nextTotalScore: number;
    reason?: string;
    createdAt: Date;
  }): UserIntelligenceHistory {
    return new UserIntelligenceHistory(
      params.id,
      params.userId,
      params.prevTotalScore,
      params.nextTotalScore,
      params.reason ?? null,
      params.createdAt,
    );
  }

  // --- 파생 비즈니스 속성 ---

  /** 점수 변화량 (양수: 상승, 음수: 하락) */
  get scoreDelta(): number {
    return this._nextTotalScore - this._prevTotalScore;
  }

  /** 상승 여부 */
  get isUpgrade(): boolean {
    return this.scoreDelta > 0;
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint { return this._userId; }
  get prevTotalScore(): number { return this._prevTotalScore; }
  get nextTotalScore(): number { return this._nextTotalScore; }
  get reason(): string | null { return this._reason; }
  get createdAt(): Date { return this._createdAt; }
}
