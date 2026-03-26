import { ArtifactGrade, ArtifactLogType, Prisma } from '@prisma/client';

/**
 * [Audit] 보너스 풀 분배 상세 내역
 */
export interface BonusDistributionDetails {
  eligibleUserCount: number;
  targetGrade: ArtifactGrade;
  perUserAmountUsd: number;
}

/**
 * [Audit] 보너스 풀 적립/조정 상세 내역
 */
export interface BonusAccumulationDetails {
  sourceUserId?: bigint;
  sourceType: string; // 'GAME_REVENUE', 'ADMIN_ADJUST' 등
}

/**
 * [Audit] 보너스 풀 로그 상세 내역 유니온 타입
 */
export type ArtifactBonusPoolLogDetails =
  | BonusDistributionDetails
  | BonusAccumulationDetails;

/**
 * [Artifact] 보너스 풀 통합 로그 (적립 및 분배 원장) 엔티티
 */
export class ArtifactBonusPoolLog {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint | null,
    private readonly _amountUsd: Prisma.Decimal,
    private readonly _type: ArtifactLogType,
    private readonly _details: ArtifactBonusPoolLogDetails | null,
    private readonly _createdAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint | null;
    amountUsd: Prisma.Decimal;
    type: ArtifactLogType;
    details: ArtifactBonusPoolLogDetails | null;
    createdAt: Date;
  }): ArtifactBonusPoolLog {
    return new ArtifactBonusPoolLog(
      data.id,
      data.userId,
      data.amountUsd,
      data.type,
      data.details,
      data.createdAt,
    );
  }

  /**
   * 신규 보너스 풀 변동 로그 생성
   */
  static create(params: {
    id: bigint;
    userId?: bigint | null;
    amountUsd: Prisma.Decimal;
    type: ArtifactLogType;
    createdAt: Date;
    details?: ArtifactBonusPoolLogDetails | null;
  }): ArtifactBonusPoolLog {
    return new ArtifactBonusPoolLog(
      params.id,
      params.userId ?? null,
      params.amountUsd,
      params.type,
      params.details ?? null,
      params.createdAt,
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint | null { return this._userId; }
  get amountUsd(): Prisma.Decimal { return this._amountUsd; }
  get type(): ArtifactLogType { return this._type; }
  get details(): ArtifactBonusPoolLogDetails | null { return this._details; }
  get createdAt(): Date { return this._createdAt; }
}
