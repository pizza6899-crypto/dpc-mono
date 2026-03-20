import { Prisma } from '@prisma/client';
import type {
  ExchangeCurrencyCode,
  WageringSourceType,
  WageringStatus,
  WageringCancellationReason,
  WageringTargetType,
  WageringCalculationMethod,
} from '@prisma/client';
import type { WageringAppliedConfig } from './wagering-applied-config';

export class WageringRequirement {
  private constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly currency: ExchangeCurrencyCode,
    public readonly rewardId: bigint,
    public readonly calculationMethod: WageringCalculationMethod,

    public readonly targetType: WageringTargetType,
    private _requiredAmount: Prisma.Decimal,
    private _wageredAmount: Prisma.Decimal,
    private _requiredCount: number,
    private _wageredCount: number,

    private _isAutoCancelable: boolean,

    public readonly principalAmount: Prisma.Decimal,
    public readonly multiplier: Prisma.Decimal,
    public readonly bonusAmount: Prisma.Decimal,
    public readonly initialFundAmount: Prisma.Decimal,

    private _currentBalance: Prisma.Decimal,
    private _totalBetAmount: Prisma.Decimal,
    private _totalWinAmount: Prisma.Decimal,

    public readonly realMoneyRatio: Prisma.Decimal,
    public readonly isForfeitable: boolean,

    public readonly parentWageringId: bigint | null,
    public readonly appliedConfig: WageringAppliedConfig,
    private _maxCashConversion: Prisma.Decimal | null,
    private _convertedAmount: Prisma.Decimal | null,
    private _isPaused: boolean,
    private _status: WageringStatus,
    public readonly priority: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    public readonly expiresAt: Date | null,
    private _lastContributedAt: Date | null,
    private _completedAt: Date | null,
    private _cancelledAt: Date | null,
    private _cancellationNote: string | null,
    private _cancellationReasonType: WageringCancellationReason | null,
    private _cancelledBy: string | null,
    private _balanceAtCancellation: Prisma.Decimal | null,
    private _forfeitedAmount: Prisma.Decimal | null,
    private _accumulatedBetAmount: Prisma.Decimal,
  ) {}

  // Getters
  get requiredAmount(): Prisma.Decimal {
    return this._requiredAmount;
  }
  get wageredAmount(): Prisma.Decimal {
    return this._wageredAmount;
  }
  get requiredCount(): number {
    return this._requiredCount;
  }
  get wageredCount(): number {
    return this._wageredCount;
  }

  get currentBalance(): Prisma.Decimal {
    return this._currentBalance;
  }
  get totalBetAmount(): Prisma.Decimal {
    return this._totalBetAmount;
  }
  get totalWinAmount(): Prisma.Decimal {
    return this._totalWinAmount;
  }

  get isAutoCancelable(): boolean {
    return this._isAutoCancelable;
  }
  get maxCashConversion(): Prisma.Decimal | null {
    return this._maxCashConversion;
  }
  get convertedAmount(): Prisma.Decimal | null {
    return this._convertedAmount;
  }
  get isPaused(): boolean {
    return this._isPaused;
  }
  get status(): WageringStatus {
    return this._status;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get lastContributedAt(): Date | null {
    return this._lastContributedAt;
  }
  get completedAt(): Date | null {
    return this._completedAt;
  }
  get cancelledAt(): Date | null {
    return this._cancelledAt;
  }
  get cancellationNote(): string | null {
    return this._cancellationNote;
  }
  get cancellationReasonType(): WageringCancellationReason | null {
    return this._cancellationReasonType;
  }
  get cancelledBy(): string | null {
    return this._cancelledBy;
  }
  get balanceAtCancellation(): Prisma.Decimal | null {
    return this._balanceAtCancellation;
  }
  get forfeitedAmount(): Prisma.Decimal | null {
    return this._forfeitedAmount;
  }
  get accumulatedBetAmount(): Prisma.Decimal {
    return this._accumulatedBetAmount;
  }

  get remainingAmount(): Prisma.Decimal {
    if (this.targetType !== 'AMOUNT') return new Prisma.Decimal('0');
    const remaining = this._requiredAmount.sub(this._wageredAmount);
    return remaining.isNeg() ? new Prisma.Decimal('0') : remaining;
  }

  get remainingCount(): number {
    if (this.targetType !== 'ROUND_COUNT') return 0;
    const remaining = this._requiredCount - this._wageredCount;
    return remaining < 0 ? 0 : remaining;
  }

  /**
   * 현재 달성률 (0-100)
   */
  get progressRate(): number {
    if (this.targetType === 'AMOUNT') {
      if (this._requiredAmount.isZero()) return 100;
      return this._wageredAmount.div(this._requiredAmount).mul(100).toNumber();
    } else {
      if (this._requiredCount <= 0) return 100;
      return (this._wageredCount / this._requiredCount) * 100;
    }
  }

  get isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }

  get isExpired(): boolean {
    return this.expiresAt !== null && this.expiresAt < new Date();
  }

  /**
   * 롤링 조건(요구 금액 혹 요구 횟수)을 모두 충족했는지 여부
   */
  get isFulfilled(): boolean {
    if (this.targetType === 'AMOUNT') {
      return this._wageredAmount.greaterThanOrEqualTo(this._requiredAmount);
    } else {
      return this._wageredCount >= this._requiredCount;
    }
  }

  get isActive(): boolean {
    return this._status === 'ACTIVE' && !this._isPaused && !this.isExpired;
  }

  /**
   * 웨이저링 금액 롤링을 기여합니다. (targetType = AMOUNT 전용)
   */
  contributeAmount(
    wagered: Prisma.Decimal,
    betAmount: Prisma.Decimal,
  ): Prisma.Decimal {
    if (!this.isActive) return new Prisma.Decimal(0);

    // [중요] recordActivity를 통해 이미 차감된 것으로 가정하고 기여도만 기록
    this._totalBetAmount = this._totalBetAmount.add(betAmount);

    if (this.targetType === 'AMOUNT') {
      const remaining = this.remainingAmount;
      const actualWagered = wagered.greaterThan(remaining)
        ? remaining
        : wagered;
      this._wageredAmount = this._wageredAmount.add(actualWagered);

      this._lastContributedAt = new Date();
      this._updatedAt = new Date();
      return actualWagered;
    }

    this._updatedAt = new Date();
    return new Prisma.Decimal(0);
  }

  /**
   * 라운드 판수 롤링을 기여합니다. (targetType = ROUND_COUNT 전용)
   */
  contributeRound(betAmount: Prisma.Decimal): number {
    if (!this.isActive) return 0;

    // [중요] recordActivity를 통해 이미 차감된 것으로 가정하고 기여도만 기록
    this._totalBetAmount = this._totalBetAmount.add(betAmount);

    if (this.targetType === 'ROUND_COUNT') {
      const remaining = this.remainingCount;
      const actualCount = remaining > 0 ? 1 : 0;
      this._wageredCount += actualCount;

      this._lastContributedAt = new Date();
      this._updatedAt = new Date();
      return actualCount;
    }

    this._updatedAt = new Date();
    return 0;
  }

  /**
   * 베팅 취소 시 롤링 금액이나 판수를 회수(차감)합니다.
   */
  reverseContribution(wagered: Prisma.Decimal, betAmount: Prisma.Decimal): void {
    if (!this.isActive) return;

    this._totalBetAmount = this._totalBetAmount.sub(betAmount);
    if (this._totalBetAmount.isNeg()) {
      this._totalBetAmount = new Prisma.Decimal(0);
    }

    if (this.targetType === 'AMOUNT') {
      this._wageredAmount = this._wageredAmount.sub(wagered);
      if (this._wageredAmount.isNeg()) {
        this._wageredAmount = new Prisma.Decimal(0);
      }
    } else if (this.targetType === 'ROUND_COUNT') {
      this._wageredCount -= 1;
      if (this._wageredCount < 0) {
        this._wageredCount = 0;
      }
    }

    this._updatedAt = new Date();
  }

  /**
   * 베팅 활동을 기록하고 자금을 소모합니다. (롤링 기여 여부와 상관없이 호출 가능)
   */
  recordActivity(betAmount: Prisma.Decimal): void {
    if (!this.isActive) return;
    this._accumulatedBetAmount = this._accumulatedBetAmount.add(betAmount);
    this._currentBalance = this._currentBalance.sub(betAmount);
    this._updatedAt = new Date();
  }

  /**
   * 베팅 취소 시 차감되었던 자금을 다시 복원합니다.
   */
  reverseActivity(refundAmount: Prisma.Decimal): void {
    if (!this.isActive) return;
    this._accumulatedBetAmount = this._accumulatedBetAmount.sub(refundAmount);
    if (this._accumulatedBetAmount.isNeg()) {
      this._accumulatedBetAmount = new Prisma.Decimal(0);
    }
    this._currentBalance = this._currentBalance.add(refundAmount);
    this._updatedAt = new Date();
  }

  /**
   * 당첨(Win) 시 자금 내역을 업데이트합니다.
   */
  recordWin(winAmount: Prisma.Decimal): void {
    if (!this.isActive) return;
    this._totalWinAmount = this._totalWinAmount.add(winAmount);
    this._currentBalance = this._currentBalance.add(winAmount);
    this._updatedAt = new Date();
  }

  /**
   * 특정 게임/카테고리에 대해 이 웨이저링(보너스)이 유효한지 확인합니다.
   * 현재는 모두 true를 반환하며, 향후 appliedConfig의 필터 설정을 기반으로 로직을 확장할 수 있습니다.
   */
  public isValidForGame(params: {
    providerId?: string;
    category?: string;
    gameId?: string;
  }): boolean {
    // 1. 일시정지 상태면 사용 불가능
    if (this._isPaused) return false;

    // 2. [추후 구현] appliedConfig에 정의된 허용/차단 목록 체크
    // 예: if (this.appliedConfig.snapshot?.excludedCategories?.includes(params.category)) return false;

    return true;
  }

  pause(): void {
    this._isPaused = true;
    this._updatedAt = new Date();
  }

  resume(): void {
    this._isPaused = false;
    this._updatedAt = new Date();
  }

  complete(finalBalance?: Prisma.Decimal): void {
    if (this._status !== 'ACTIVE') return;

    this._status = 'COMPLETED';
    this._completedAt = new Date();
    this._updatedAt = new Date();

    const balanceToConvert = finalBalance ?? this._currentBalance;

    // 현금 전환 상한선(maxConversion) 적용 로직
    if (this._maxCashConversion) {
      this._convertedAmount = balanceToConvert.greaterThan(
        this._maxCashConversion,
      )
        ? this._maxCashConversion
        : balanceToConvert;
    } else {
      this._convertedAmount = balanceToConvert;
    }
  }

  cancel(params: {
    reason: WageringCancellationReason;
    note?: string;
    cancelledBy?: string;
    balanceAtCancellation?: Prisma.Decimal;
    forfeitedAmount?: Prisma.Decimal;
  }): void {
    if (this._status !== 'ACTIVE') return;

    this._status = 'CANCELLED';
    this._cancelledAt = new Date();
    this._updatedAt = new Date();
    this._cancellationReasonType = params.reason;
    this._cancellationNote = params.note || null;
    this._cancelledBy = params.cancelledBy || 'SYSTEM';
    this._balanceAtCancellation =
      params.balanceAtCancellation || this._currentBalance;
    this._forfeitedAmount = params.forfeitedAmount || null;
  }

  void(note?: string, cancelledBy?: string): void {
    this._status = 'VOIDED';
    this._cancelledAt = new Date();
    this._updatedAt = new Date();
    this._cancellationReasonType = 'SYSTEM_ERROR';
    this._cancellationNote = note || null;
    this._cancelledBy = cancelledBy || 'SYSTEM';
  }

  expire(): void {
    if (this._status !== 'ACTIVE') return;

    this._status = 'EXPIRED';
    this._cancelledAt = new Date();
    this._updatedAt = new Date();
    this._cancellationReasonType = 'EXPIRED';
    this._cancelledBy = 'SYSTEM';
  }

  static create(params: {
    id?: bigint;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    rewardId: bigint;
    calculationMethod?: WageringCalculationMethod;
    targetType: WageringTargetType;

    requiredAmount?: Prisma.Decimal;
    requiredCount?: number;

    principalAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    multiplier: Prisma.Decimal;
    initialFundAmount: Prisma.Decimal;
    realMoneyRatio: Prisma.Decimal;

    isForfeitable?: boolean;
    isAutoCancelable?: boolean;
    maxCashConversion?: Prisma.Decimal | null;
    appliedConfig?: WageringAppliedConfig;

    parentWageringId?: bigint | null;
    priority?: number;
    expiresAt?: Date | null;
    accumulatedBetAmount?: Prisma.Decimal;
  }): WageringRequirement {
    return new WageringRequirement(
      params.id ?? 0n,
      params.userId,
      params.currency,
      params.rewardId,
      params.calculationMethod ?? 'WEIGHTED',
      params.targetType,
      params.requiredAmount ?? new Prisma.Decimal(0),
      new Prisma.Decimal(0), // initial wageredAmount
      params.requiredCount ?? 0,
      0, // initial wageredCount

      params.isAutoCancelable ?? true,

      params.principalAmount,
      params.multiplier,
      params.bonusAmount,
      params.initialFundAmount,

      params.initialFundAmount, // currentBalance starts with initial fund
      new Prisma.Decimal(0), // totalBetAmount
      new Prisma.Decimal(0), // totalWinAmount

      params.realMoneyRatio,
      params.isForfeitable ?? false,

      params.parentWageringId ?? null,
      params.appliedConfig ?? {},
      params.maxCashConversion ?? null,
      null,
      false,
      'ACTIVE',
      params.priority ?? 0,
      new Date(),
      new Date(),
      params.expiresAt ?? null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      params.accumulatedBetAmount ?? new Prisma.Decimal(0),
    );
  }

  static fromPersistence(data: {
    id: bigint;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    rewardId: bigint;
    calculationMethod: WageringCalculationMethod;
    targetType: WageringTargetType;

    requiredAmount: Prisma.Decimal;
    wageredAmount: Prisma.Decimal;
    requiredCount: number;
    wageredCount: number;

    isAutoCancelable: boolean;

    principalAmount: Prisma.Decimal;
    multiplier: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    initialFundAmount: Prisma.Decimal;

    currentBalance: Prisma.Decimal;
    totalBetAmount: Prisma.Decimal;
    totalWinAmount: Prisma.Decimal;

    realMoneyRatio: Prisma.Decimal;
    isForfeitable: boolean;

    parentWageringId: bigint | null;
    appliedConfig: WageringAppliedConfig;
    maxCashConversion: Prisma.Decimal | null;
    convertedAmount: Prisma.Decimal | null;
    isPaused: boolean;
    status: WageringStatus;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    lastContributedAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    cancellationNote: string | null;
    cancellationReasonType: WageringCancellationReason | null;
    cancelledBy: string | null;
    balanceAtCancellation: Prisma.Decimal | null;
    forfeitedAmount: Prisma.Decimal | null;
    accumulatedBetAmount: Prisma.Decimal;
  }): WageringRequirement {
    return new WageringRequirement(
      data.id,
      data.userId,
      data.currency,
      data.rewardId,
      data.calculationMethod,
      data.targetType,
      data.requiredAmount,
      data.wageredAmount,
      data.requiredCount,
      data.wageredCount,

      data.isAutoCancelable,

      data.principalAmount,
      data.multiplier,
      data.bonusAmount,
      data.initialFundAmount,

      data.currentBalance,
      data.totalBetAmount,
      data.totalWinAmount,

      data.realMoneyRatio,
      data.isForfeitable,

      data.parentWageringId,
      data.appliedConfig,
      data.maxCashConversion,
      data.convertedAmount,
      data.isPaused,
      data.status,
      data.priority,
      data.createdAt,
      data.updatedAt,
      data.expiresAt,
      data.lastContributedAt,
      data.completedAt,
      data.cancelledAt,
      data.cancellationNote,
      data.cancellationReasonType,
      data.cancelledBy,
      data.balanceAtCancellation,
      data.forfeitedAmount,
      data.accumulatedBetAmount,
    );
  }

  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      currency: this.currency,
      rewardId: this.rewardId,
      calculationMethod: this.calculationMethod,
      targetType: this.targetType,
      requiredAmount: this._requiredAmount,
      wageredAmount: this._wageredAmount,
      requiredCount: this._requiredCount,
      wageredCount: this._wageredCount,
      isAutoCancelable: this._isAutoCancelable,
      principalAmount: this.principalAmount,
      multiplier: this.multiplier,
      bonusAmount: this.bonusAmount,
      initialFundAmount: this.initialFundAmount,
      currentBalance: this._currentBalance,
      totalBetAmount: this._totalBetAmount,
      totalWinAmount: this._totalWinAmount,
      accumulatedBetAmount: this._accumulatedBetAmount,
      realMoneyRatio: this.realMoneyRatio,
      isForfeitable: this.isForfeitable,
      parentWageringId: this.parentWageringId,
      appliedConfig: this.appliedConfig,
      maxCashConversion: this._maxCashConversion,
      convertedAmount: this._convertedAmount,
      isPaused: this._isPaused,
      status: this._status,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      expiresAt: this.expiresAt,
      lastContributedAt: this._lastContributedAt,
      completedAt: this._completedAt,
      cancelledAt: this._cancelledAt,
      cancellationNote: this._cancellationNote,
      cancellationReasonType: this._cancellationReasonType,
      cancelledBy: this._cancelledBy,
      balanceAtCancellation: this._balanceAtCancellation,
      forfeitedAmount: this._forfeitedAmount,
    };
  }
}
