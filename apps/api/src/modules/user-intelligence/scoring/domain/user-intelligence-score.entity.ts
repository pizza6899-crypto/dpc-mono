/**
 * 지능형 점수 기반 유저 등급
 */
export enum IntelligenceGrade {
  PLATINUM = 'PLATINUM', // 1800+
  GOLD = 'GOLD',         // 1500~1799
  SILVER = 'SILVER',     // 1200~1499
  BRONZE = 'BRONZE',     // 1000~1199
  RISK = 'RISK',         // 999 이하 (리스크 차감 후 1000 미만)
}

export interface ScoreDetails {
  netLossCV?: number;
  depositCV?: number;
  gatheredAt?: string;
}

/**
 * [Scoring] 유저별 지능형 점수 엔티티
 */
export class UserIntelligenceScore {
  private constructor(
    private readonly _userId: bigint,
    private readonly _totalScore: number,
    private readonly _valueScore: number,
    private readonly _riskScore: number,
    private readonly _scoreValueIndex: number,
    private readonly _scoreDepositAmount: number,
    private readonly _scoreDepositCount: number,
    private readonly _scoreRolling: number,
    private readonly _scoreBehavior: number,
    private readonly _scoreRiskPromotion: number,
    private readonly _scoreRiskTechnical: number,
    private readonly _scoreRiskBehavior: number,
    private readonly _details: ScoreDetails | null,
    private readonly _updatedAt: Date,
  ) { }

  static rehydrate(data: {
    userId: bigint;
    totalScore: number;
    valueScore: number;
    riskScore: number;
    scoreValueIndex: number;
    scoreDepositAmount: number;
    scoreDepositCount: number;
    scoreRolling: number;
    scoreBehavior: number;
    scoreRiskPromotion: number;
    scoreRiskTechnical: number;
    scoreRiskBehavior: number;
    details: ScoreDetails | null;
    updatedAt: Date;
  }): UserIntelligenceScore {
    return new UserIntelligenceScore(
      data.userId,
      data.totalScore,
      data.valueScore,
      data.riskScore,
      data.scoreValueIndex,
      data.scoreDepositAmount,
      data.scoreDepositCount,
      data.scoreRolling,
      data.scoreBehavior,
      data.scoreRiskPromotion,
      data.scoreRiskTechnical,
      data.scoreRiskBehavior,
      data.details,
      data.updatedAt,
    );
  }

  // --- 비즈니스 로직 ---

  /**
   * 총점 기반 유저 등급 판별
   */
  get grade(): IntelligenceGrade {
    if (this._totalScore >= 1800) return IntelligenceGrade.PLATINUM;
    if (this._totalScore >= 1500) return IntelligenceGrade.GOLD;
    if (this._totalScore >= 1200) return IntelligenceGrade.SILVER;
    if (this._totalScore >= 1000) return IntelligenceGrade.BRONZE;
    return IntelligenceGrade.RISK;
  }

  /** 리스크 비율 (riskScore / valueScore) */
  get riskRatio(): number {
    if (this._valueScore === 0) return 0;
    return parseFloat((this._riskScore / this._valueScore).toFixed(4));
  }

  // --- Getters ---
  get userId(): bigint { return this._userId; }
  get totalScore(): number { return this._totalScore; }
  get valueScore(): number { return this._valueScore; }
  get riskScore(): number { return this._riskScore; }
  get scoreValueIndex(): number { return this._scoreValueIndex; }
  get scoreDepositAmount(): number { return this._scoreDepositAmount; }
  get scoreDepositCount(): number { return this._scoreDepositCount; }
  get scoreRolling(): number { return this._scoreRolling; }
  get scoreBehavior(): number { return this._scoreBehavior; }
  get scoreRiskPromotion(): number { return this._scoreRiskPromotion; }
  get scoreRiskTechnical(): number { return this._scoreRiskTechnical; }
  get scoreRiskBehavior(): number { return this._scoreRiskBehavior; }
  get details(): ScoreDetails | null { return this._details; }
  get updatedAt(): Date { return this._updatedAt; }
}
