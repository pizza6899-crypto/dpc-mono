import { ArtifactGrade, ArtifactLogType, ExchangeCurrencyCode, Prisma } from '@prisma/client';

/**
 * [Audit] 유물 활동 상세 내역 (타입별 전용 인터페이스)
 */
export interface DrawLogDetails {
  drawCount: number;
  isPity: boolean;
}

export interface EquipLogDetails {
  slotNo: number;
}

export interface SynthesisLogDetails {
  consumedIds: bigint[];
  resultArtifactId?: bigint;
  isSuccess: boolean;
}

export interface DistributionLogDetails {
  distributionId: bigint;
  poolBalanceBefore: number;
}

export interface AdminAdjustLogDetails {
  reason: string;
  adminId: bigint;
}

/**
 * [Audit] 유물 활동 타입별 상세 내역 유니온 타입
 */
export type UserArtifactLogDetails =
  | DrawLogDetails
  | EquipLogDetails
  | SynthesisLogDetails
  | DistributionLogDetails
  | AdminAdjustLogDetails;

/**
 * [Artifact] 유물 활동 로그 엔티티
 */
export class UserArtifactLog {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint,
    private readonly _artifactId: bigint,
    private readonly _type: ArtifactLogType,
    private readonly _grade: ArtifactGrade,
    private readonly _cost: Prisma.Decimal | null,
    private readonly _currency: ExchangeCurrencyCode | null,
    private readonly _details: UserArtifactLogDetails | null,
    private readonly _createdAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원 (Partition Column 포함)
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint;
    artifactId: bigint;
    type: ArtifactLogType;
    grade: ArtifactGrade;
    cost: Prisma.Decimal | null;
    currency: ExchangeCurrencyCode | null;
    details: UserArtifactLogDetails | null;
    createdAt: Date;
  }): UserArtifactLog {
    return new UserArtifactLog(
      data.id,
      data.userId,
      data.artifactId,
      data.type,
      data.grade,
      data.cost,
      data.currency,
      data.details,
      data.createdAt,
    );
  }

  /**
   * 신규 로그 생성
   */
  static create(params: {
    id: bigint;
    userId: bigint;
    artifactId: bigint;
    type: ArtifactLogType;
    grade: ArtifactGrade;
    createdAt: Date;
    cost?: Prisma.Decimal | null;
    currency?: ExchangeCurrencyCode | null;
    details?: UserArtifactLogDetails | null;
  }): UserArtifactLog {
    return new UserArtifactLog(
      params.id,
      params.userId,
      params.artifactId,
      params.type,
      params.grade,
      params.cost ?? null,
      params.currency ?? null,
      params.details ?? null,
      params.createdAt,
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint { return this._userId; }
  get artifactId(): bigint { return this._artifactId; }
  get type(): ArtifactLogType { return this._type; }
  get grade(): ArtifactGrade { return this._grade; }
  get cost(): Prisma.Decimal | null { return this._cost; }
  get currency(): ExchangeCurrencyCode | null { return this._currency; }
  get details(): UserArtifactLogDetails | null { return this._details; }
  get createdAt(): Date { return this._createdAt; }
}
