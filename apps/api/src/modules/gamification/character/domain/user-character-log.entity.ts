import { CharacterLogType, Prisma } from '@prisma/client';
import { UserStats } from './user-character.entity';

/**
 * [Gamification] 캐릭터 로그 상세 정보 Union 타입
 */
export type UserCharacterLogDetails =
  | { type: 'GAIN_XP'; currentXp: string }
  | { type: 'REVERT_XP'; currentXp: string }
  | { type: 'LEVEL_UP'; totalEarnedXp: string; reason: string }
  | { type: 'STAT_ALLOCATION'; mode: string; statName: string; beforeBaseStat: number; investedPoints: number; afterBaseStat: number }
  | {
    type: 'STAT_RESET';
    resetCount: number;
    reason?: string;
    adminTriggered?: boolean;
    cost?: string;
    currency?: string;
    previousStats?: Partial<UserStats>;
    isFreePromo?: boolean;
  }

/**
 * [Gamification] 캐릭터 성장 및 스탯 변동 이력 로그 엔티티
 * 
 * 레벨업, 스탯 투자, 초기화 등의 변화 시점의 스냅샷을 기록하여
 * 데이터 무결성을 보장하고 유저 활동 이력을 추적합니다.
 */
export class UserCharacterLog {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint,
    private readonly _type: CharacterLogType,
    private readonly _beforeLevel: number,
    private readonly _afterLevel: number,
    private readonly _beforeStatPoints: number,
    private readonly _afterStatPoints: number,
    private readonly _amount: Prisma.Decimal | null,
    private readonly _referenceId: bigint | null,
    private readonly _details: UserCharacterLogDetails | null,
    private readonly _createdAt: Date,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint;
    type: CharacterLogType;
    beforeLevel: number;
    afterLevel: number;
    beforeStatPoints: number;
    afterStatPoints: number;
    amount: Prisma.Decimal | null;
    referenceId: bigint | null;
    details: UserCharacterLogDetails | null;
    createdAt: Date;
  }): UserCharacterLog {
    return new UserCharacterLog(
      data.id,
      data.userId,
      data.type,
      data.beforeLevel,
      data.afterLevel,
      data.beforeStatPoints,
      data.afterStatPoints,
      data.amount,
      data.referenceId,
      data.details,
      data.createdAt,
    );
  }

  /**
   * 새로운 로그 생성
   */
  static create(params: {
    id: bigint; // Snowflake ID 등 애플리케이션에서 생성한 ID
    userId: bigint;
    type: CharacterLogType;
    beforeLevel: number;
    afterLevel: number;
    beforeStatPoints: number;
    afterStatPoints: number;
    amount?: Prisma.Decimal | null;
    referenceId?: bigint | null;
    details?: UserCharacterLogDetails;
    createdAt: Date; // 파티셔닝을위해 명시적으로 지정 가능 (기본값 now)
  }): UserCharacterLog {
    return new UserCharacterLog(
      params.id,
      params.userId,
      params.type,
      params.beforeLevel,
      params.afterLevel,
      params.beforeStatPoints,
      params.afterStatPoints,
      params.amount ?? null,
      params.referenceId ?? null,
      params.details ?? null,
      params.createdAt,
    );
  }

  // --- Getters ---

  get id(): bigint { return this._id; }
  get userId(): bigint { return this._userId; }
  get type(): CharacterLogType { return this._type; }
  get beforeLevel(): number { return this._beforeLevel; }
  get afterLevel(): number { return this._afterLevel; }
  get beforeStatPoints(): number { return this._beforeStatPoints; }
  get afterStatPoints(): number { return this._afterStatPoints; }
  get amount(): Prisma.Decimal | null { return this._amount; }
  get referenceId(): bigint | null { return this._referenceId; }
  get details(): UserCharacterLogDetails | null { return this._details; }
  get createdAt(): Date { return this._createdAt; }
}
