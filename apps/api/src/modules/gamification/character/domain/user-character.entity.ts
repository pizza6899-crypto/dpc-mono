import { Prisma } from '@prisma/client';
import { InsufficientStatPointsException, StatLimitExceededException, InvalidStatTypeException } from './character.exception';

/**
 * 6가지 핵심 스탯을 나타내는 타입
 */
export interface UserStats {
  casinoBenefit: number;
  slotBenefit: number;
  sportsBenefit: number;
  minigameBenefit: number;
  badBeatJackpot: number;
  criticalJackpot: number;
}

/**
 * [Gamification] 유저 캐릭터 및 스탯 정보 도메인 엔티티
 * 
 * 유저의 레벨, 경험치, 스탯 포인트 및 핵심 능력치를 추적하고
 * 레벨업, 스텟 배분, 스텟 초기화 등의 비즈니스 로직을 수행합니다.
 */
export class UserCharacter {
  private constructor(
    private readonly _userId: bigint,
    private _level: number,
    private _xp: Prisma.Decimal,
    private _statPoints: number,
    private _totalStatPoints: number,
    private _stats: UserStats,
    private _totalStats: UserStats,
    private _statResetCount: number,
    private _currentTitle: string | null,
    private _lastLeveledUpAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    userId: bigint;
    level: number;
    xp: Prisma.Decimal;
    statPoints: number;
    totalStatPoints: number;
    casinoBenefit: number;
    slotBenefit: number;
    sportsBenefit: number;
    minigameBenefit: number;
    badBeatJackpot: number;
    criticalJackpot: number;
    totalCasinoBenefit: number;
    totalSlotBenefit: number;
    totalSportsBenefit: number;
    totalMinigameBenefit: number;
    totalBadBeatJackpot: number;
    totalCriticalJackpot: number;
    statResetCount: number;
    currentTitle: string | null;
    lastLeveledUpAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserCharacter {
    return new UserCharacter(
      data.userId,
      data.level,
      data.xp,
      data.statPoints,
      data.totalStatPoints,
      {
        casinoBenefit: data.casinoBenefit,
        slotBenefit: data.slotBenefit,
        sportsBenefit: data.sportsBenefit,
        minigameBenefit: data.minigameBenefit,
        badBeatJackpot: data.badBeatJackpot,
        criticalJackpot: data.criticalJackpot,
      },
      {
        casinoBenefit: data.totalCasinoBenefit,
        slotBenefit: data.totalSlotBenefit,
        sportsBenefit: data.totalSportsBenefit,
        minigameBenefit: data.totalMinigameBenefit,
        badBeatJackpot: data.totalBadBeatJackpot,
        criticalJackpot: data.totalCriticalJackpot,
      },
      data.statResetCount,
      data.currentTitle,
      data.lastLeveledUpAt,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 새로운 캐릭터 생성 (초기 상태)
   */
  static create(userId: bigint): UserCharacter {
    return new UserCharacter(
      userId,
      1, // default level
      new Prisma.Decimal(0), // default xp
      0, // statPoints
      0, // totalStatPoints
      {
        casinoBenefit: 0,
        slotBenefit: 0,
        sportsBenefit: 0,
        minigameBenefit: 0,
        badBeatJackpot: 0,
        criticalJackpot: 0,
      },
      {
        casinoBenefit: 0,
        slotBenefit: 0,
        sportsBenefit: 0,
        minigameBenefit: 0,
        badBeatJackpot: 0,
        criticalJackpot: 0,
      },
      0, // statResetCount
      null, // currentTitle
      null, // lastLeveledUpAt
      new Date(),
      new Date(),
    );
  }

  // --- 비즈니스 로직 메서드 ---

  /**
   * 경험치 획득 및 차감
   * @param amount 가감할 경험치량 (양수: 획득, 음수: 차감)
   */
  gainXp(amount: Prisma.Decimal): void {
    if (amount.isZero()) return;

    this._xp = this._xp.add(amount);

    // 경험치가 0 미만으로 떨어지지 않도록 방어 (음수 보정)
    if (this._xp.isNegative()) {
      this._xp = new Prisma.Decimal(0);
    }

    this._updatedAt = new Date();
  }

  /**
   * 레벨업 수행
   * 
   * @param requiredXp 현재 레벨에서 다음 레벨로 가기 위해 소모되는 XP (혹은 누적 기준일 경우 체크 용도)
   * @param statPointsGrant 보너스로 지급될 스탯 포인트
   */
  levelUp(requiredXp: Prisma.Decimal, statPointsGrant: number): void {
    // 1. 경험치 차감 (누적 방식이 아닌 소모/구간 방식일 경우)
    // 만약 누적 방식이라면 차감 없이 레벨만 올리고, 로직은 서비스에서 관리
    // 여기서는 차감 없는 누적 방식으로 가정하고, 필요 경험치 도달 여부는 외부에서 판단하여 이 메서드를 호출한다고 봅니다.

    this._level += 1;
    this._statPoints += statPointsGrant;
    this._totalStatPoints += statPointsGrant;
    this._lastLeveledUpAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 스탯 포인트 투자
   */
  allocateStatPoint(statName: keyof UserStats, points: number, maxLimit: number): void {
    if (points <= 0) return;

    // 1. 가용 포인트 확인
    if (this._statPoints < points) {
      throw new InsufficientStatPointsException();
    }

    // 2. 해당 스탯 존재 여부 및 상한선 확인
    if (!(statName in this._stats)) {
      throw new InvalidStatTypeException(statName);
    }

    const currentVal = this._stats[statName];
    if (currentVal + points > maxLimit) {
      throw new StatLimitExceededException(statName, maxLimit);
    }

    // 3. 투자 적용
    this._stats[statName] += points;
    this._statPoints -= points;
    this._updatedAt = new Date();
  }

  /**
   * 스탯 포인트 1 감소
   */
  decrementStatPoint(statName: keyof UserStats): void {
    // 1. 해당 스탯 존재 여부 및 0보다 큰지 확인
    if (!(statName in this._stats)) {
      throw new InvalidStatTypeException(statName);
    }

    if (this._stats[statName] <= 0) return;

    // 2. 감소 및 포인트 반환
    this._stats[statName] -= 1;
    this._statPoints += 1;
    this._updatedAt = new Date();
  }

  /**
   * 스탯 포인트 최대 투자 (올인)
   * 가용 포인트와 상한선 중 더 작은 값만큼 투자합니다.
   */
  allocateMaxStatPoint(statName: keyof UserStats, maxLimit: number): void {
    if (this._statPoints <= 0) return;

    // 1. 해당 스탯 존재 여부 확인
    if (!(statName in this._stats)) {
      throw new InvalidStatTypeException(statName);
    }

    const currentVal = this._stats[statName];
    const roomLeft = maxLimit - currentVal;
    
    if (roomLeft <= 0) return;

    // 2. 투자할 포인트 결정 (가용 포인트 vs 남은 상한선)
    const pointsToInvest = Math.min(this._statPoints, roomLeft);

    // 3. 투자 적용
    this._stats[statName] += pointsToInvest;
    this._statPoints -= pointsToInvest;
    this._updatedAt = new Date();
  }

  /**
   * 스탯 초기화
   * 
   * 모든 6가지 능력치를 기본값(0)으로 되돌리고, 
   * 지금까지 투자했던 모든 포인트를 가용 포인트 풀로 반환합니다.
   */
  resetStats(): void {
    // 모든 스탯을 0으로 초기화
    this._stats = {
      casinoBenefit: 0,
      slotBenefit: 0,
      sportsBenefit: 0,
      minigameBenefit: 0,
      badBeatJackpot: 0,
      criticalJackpot: 0,
    };

    // 남은 스탯 포인트를 총 획득 포인트와 동일하게 맞춤 (초기화)
    this._statPoints = this._totalStatPoints;
    this._statResetCount += 1;
    this._updatedAt = new Date();
  }

  /**
   * 최종 스탯 동기화 (기본 스탯 + 외부 보너스 합산)
   * 
   * 아이템 장착/해제 혹은 포인트 투자 시 호출하여 캐시 필드를 업데이트합니다.
   * @param bonuses 아이템/유물 등에서 오는 순수 보너스 수치 합계
   */
  syncTotalStats(bonuses: UserStats): void {
    this._totalStats = {
      casinoBenefit: this._stats.casinoBenefit + bonuses.casinoBenefit,
      slotBenefit: this._stats.slotBenefit + bonuses.slotBenefit,
      sportsBenefit: this._stats.sportsBenefit + bonuses.sportsBenefit,
      minigameBenefit: this._stats.minigameBenefit + bonuses.minigameBenefit,
      badBeatJackpot: this._stats.badBeatJackpot + bonuses.badBeatJackpot,
      criticalJackpot: this._stats.criticalJackpot + bonuses.criticalJackpot,
    };
    this._updatedAt = new Date();
  }

  /**
   * 칭호 장착
   */
  equipTitle(title: string | null): void {
    this._currentTitle = title;
    this._updatedAt = new Date();
  }

  // --- Getters ---

  get userId(): bigint { return this._userId; }
  get level(): number { return this._level; }
  get xp(): Prisma.Decimal { return this._xp; }
  get statPoints(): number { return this._statPoints; }
  get totalStatPoints(): number { return this._totalStatPoints; }

  get casinoBenefit(): number { return this._stats.casinoBenefit; }
  get slotBenefit(): number { return this._stats.slotBenefit; }
  get sportsBenefit(): number { return this._stats.sportsBenefit; }
  get minigameBenefit(): number { return this._stats.minigameBenefit; }
  get badBeatJackpot(): number { return this._stats.badBeatJackpot; }
  get criticalJackpot(): number { return this._stats.criticalJackpot; }

  get totalCasinoBenefit(): number { return this._totalStats.casinoBenefit; }
  get totalSlotBenefit(): number { return this._totalStats.slotBenefit; }
  get totalSportsBenefit(): number { return this._totalStats.sportsBenefit; }
  get totalMinigameBenefit(): number { return this._totalStats.minigameBenefit; }
  get totalBadBeatJackpot(): number { return this._totalStats.badBeatJackpot; }
  get totalCriticalJackpot(): number { return this._totalStats.criticalJackpot; }

  get statResetCount(): number { return this._statResetCount; }
  get currentTitle(): string | null { return this._currentTitle; }
  get lastLeveledUpAt(): Date | null { return this._lastLeveledUpAt; }

  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
