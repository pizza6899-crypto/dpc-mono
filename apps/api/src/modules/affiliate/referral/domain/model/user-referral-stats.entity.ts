// src/modules/affiliate/referral/domain/model/user-referral-stats.entity.ts

/**
 * 유저 레퍼럴 통계 엔티티
 * Phase 5: 대시보드 및 통계
 */
export class UserReferralStats {
  private constructor(
    public readonly userId: string,
    private _totalReferrals: number,
    private _activeReferrals: number,
    private _totalEarnings: bigint,
    private _pendingCommissions: bigint,
    private _pendingMilestones: bigint,
    private _totalMilestones: bigint,
    private _currentTier: number,
    private _tierProgress: number, // 0-100
    private _monthlyWager: bigint,
    private _monthlyEarnings: bigint,
    private _monthlyReferrals: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    userId: string;
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: bigint | string;
    pendingCommissions: bigint | string;
    pendingMilestones: bigint | string;
    totalMilestones: bigint | string;
    currentTier: number;
    tierProgress: number;
    monthlyWager: bigint | string;
    monthlyEarnings: bigint | string;
    monthlyReferrals: number;
    createdAt: Date;
    updatedAt: Date;
  }): UserReferralStats {
    return new UserReferralStats(
      data.userId,
      data.totalReferrals,
      data.activeReferrals,
      typeof data.totalEarnings === 'string'
        ? BigInt(data.totalEarnings)
        : data.totalEarnings,
      typeof data.pendingCommissions === 'string'
        ? BigInt(data.pendingCommissions)
        : data.pendingCommissions,
      typeof data.pendingMilestones === 'string'
        ? BigInt(data.pendingMilestones)
        : data.pendingMilestones,
      typeof data.totalMilestones === 'string'
        ? BigInt(data.totalMilestones)
        : data.totalMilestones,
      data.currentTier,
      data.tierProgress,
      typeof data.monthlyWager === 'string'
        ? BigInt(data.monthlyWager)
        : data.monthlyWager,
      typeof data.monthlyEarnings === 'string'
        ? BigInt(data.monthlyEarnings)
        : data.monthlyEarnings,
      data.monthlyReferrals,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Getters
  get totalReferrals(): number {
    return this._totalReferrals;
  }

  get activeReferrals(): number {
    return this._activeReferrals;
  }

  get totalEarnings(): bigint {
    return this._totalEarnings;
  }

  get pendingCommissions(): bigint {
    return this._pendingCommissions;
  }

  get pendingMilestones(): bigint {
    return this._pendingMilestones;
  }

  get totalMilestones(): bigint {
    return this._totalMilestones;
  }

  get currentTier(): number {
    return this._currentTier;
  }

  get tierProgress(): number {
    return this._tierProgress;
  }

  get monthlyWager(): bigint {
    return this._monthlyWager;
  }

  get monthlyEarnings(): bigint {
    return this._monthlyEarnings;
  }

  get monthlyReferrals(): number {
    return this._monthlyReferrals;
  }

  // Business Logic Methods

  /**
   * 총 대기 중인 금액 (커미션 + 마일스톤)
   */
  getTotalPending(): bigint {
    return this._pendingCommissions + this._pendingMilestones;
  }

  /**
   * 레퍼럴 추가
   */
  addReferral(): void {
    this._totalReferrals += 1;
    this._activeReferrals += 1;
    this._monthlyReferrals += 1;
  }

  /**
   * 활성 레퍼럴 감소
   */
  decreaseActiveReferrals(): void {
    if (this._activeReferrals > 0) {
      this._activeReferrals -= 1;
    }
  }

  /**
   * 커미션 추가 (대기 중)
   */
  addPendingCommission(amount: bigint): void {
    this._pendingCommissions += amount;
    this._monthlyEarnings += amount;
  }

  /**
   * 커미션 지급 완료
   */
  payCommission(amount: bigint): void {
    if (this._pendingCommissions < amount) {
      throw new Error('대기 중인 커미션이 부족합니다');
    }
    this._pendingCommissions -= amount;
    this._totalEarnings += amount;
  }

  /**
   * 마일스톤 추가 (대기 중)
   */
  addPendingMilestone(amount: bigint): void {
    this._pendingMilestones += amount;
  }

  /**
   * 마일스톤 클레임 완료
   */
  claimMilestone(amount: bigint): void {
    if (this._pendingMilestones < amount) {
      throw new Error('대기 중인 마일스톤이 부족합니다');
    }
    this._pendingMilestones -= amount;
    this._totalMilestones += amount;
    this._totalEarnings += amount;
  }

  /**
   * 월간 통계 리셋
   */
  resetMonthlyStats(): void {
    this._monthlyWager = 0n;
    this._monthlyEarnings = 0n;
    this._monthlyReferrals = 0;
  }

  /**
   * 티어 업데이트
   */
  updateTier(tier: number, progress: number): void {
    this._currentTier = tier;
    this._tierProgress = Math.max(0, Math.min(100, progress));
  }

  /**
   * 월간 베팅액 추가
   */
  addMonthlyWager(amount: bigint): void {
    this._monthlyWager += amount;
  }

  toPersistence() {
    return {
      userId: this.userId,
      totalReferrals: this._totalReferrals,
      activeReferrals: this._activeReferrals,
      totalEarnings: this._totalEarnings.toString(),
      pendingCommissions: this._pendingCommissions.toString(),
      pendingMilestones: this._pendingMilestones.toString(),
      totalMilestones: this._totalMilestones.toString(),
      currentTier: this._currentTier,
      tierProgress: this._tierProgress,
      monthlyWager: this._monthlyWager.toString(),
      monthlyEarnings: this._monthlyEarnings.toString(),
      monthlyReferrals: this._monthlyReferrals,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
