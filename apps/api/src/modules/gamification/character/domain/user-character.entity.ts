import { Prisma } from '@prisma/client';
import { InsufficientStatPointsException, StatLimitExceededException, InvalidStatTypeException } from './character.exception';

/**
 * 6가지 핵심 스탯을 나타내는 타입
 */
export interface UserStats {
  strength: number;
  agility: number;
  luck: number;
  wisdom: number;
  stamina: number;
  charisma: number;
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
    strength: number;
    agility: number;
    luck: number;
    wisdom: number;
    stamina: number;
    charisma: number;
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
        strength: data.strength,
        agility: data.agility,
        luck: data.luck,
        wisdom: data.wisdom,
        stamina: data.stamina,
        charisma: data.charisma,
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
        strength: 0,
        agility: 0,
        luck: 0,
        wisdom: 0,
        stamina: 0,
        charisma: 0,
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
   * 경험치 획득
   */
  gainXp(amount: Prisma.Decimal): void {
    if (amount.isNegative()) return;
    this._xp = this._xp.add(amount);
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
   * 스탯 초기화
   * 
   * 모든 6가지 능력치를 기본값(0)으로 되돌리고, 
   * 지금까지 투자했던 모든 포인트를 가용 포인트 풀로 반환합니다.
   */
  resetStats(): void {
    // 모든 스탯을 0으로 초기화
    this._stats = {
      strength: 0,
      agility: 0,
      luck: 0,
      wisdom: 0,
      stamina: 0,
      charisma: 0,
    };

    // 남은 스탯 포인트를 총 획득 포인트와 동일하게 맞춤 (초기화)
    this._statPoints = this._totalStatPoints;
    this._statResetCount += 1;
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
  
  get strength(): number { return this._stats.strength; }
  get agility(): number { return this._stats.agility; }
  get luck(): number { return this._stats.luck; }
  get wisdom(): number { return this._stats.wisdom; }
  get stamina(): number { return this._stats.stamina; }
  get charisma(): number { return this._stats.charisma; }
  
  get statResetCount(): number { return this._statResetCount; }
  get currentTitle(): string | null { return this._currentTitle; }
  get lastLeveledUpAt(): Date | null { return this._lastLeveledUpAt; }
  
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
