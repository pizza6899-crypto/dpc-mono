import { CharacterLogType, Prisma } from '@prisma/client';

/**
 * [Gamification] 캐릭터 로그 상세 정보 Union 타입
 */
export type UserCharacterLogDetails =
  | { type: 'GAIN_XP'; currentXp: string }
  | { type: 'REVERT_XP'; currentXp: string }
  | { type: 'LEVEL_UP'; totalEarnedXp: string; reason: string }
  | { type: 'STAT_ALLOCATION'; statName: string; pointsInvested: number }
  | { type: 'STAT_RESET'; resetCount: number }

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
   * 새로운 로그 생성 (도메인 이벤트 발생 시점 용도)
   */
  static create(params: {
    userId: bigint;
    type: CharacterLogType;
    beforeLevel: number;
    afterLevel: number;
    beforeStatPoints: number;
    afterStatPoints: number;
    amount?: Prisma.Decimal | null;
    referenceId?: bigint | null;
    details?: UserCharacterLogDetails;
  }): UserCharacterLog {
    return new UserCharacterLog(
      0n, // DB 저장 시 자동 생성되므로 0n으로 초기화
      params.userId,
      params.type,
      params.beforeLevel,
      params.afterLevel,
      params.beforeStatPoints,
      params.afterStatPoints,
      params.amount ?? null,
      params.referenceId ?? null,
      params.details ?? null,
      new Date(),
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
