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
  | AdminAdjustLogDetails;

/**
 * [Artifact] 유물 활동 로그 엔티티
 */
export class UserArtifactLog {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint | null,
    private readonly _artifactId: bigint | null,
    private readonly _type: ArtifactLogType,
    private readonly _grade: ArtifactGrade | null,
    private readonly _amountUsd: Prisma.Decimal | null,
    private readonly _details: UserArtifactLogDetails | null,
    private readonly _createdAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint | null;
    artifactId: bigint | null;
    type: ArtifactLogType;
    grade: ArtifactGrade | null;
    amountUsd: Prisma.Decimal | null;
    details: UserArtifactLogDetails | null;
    createdAt: Date;
  }): UserArtifactLog {
    return new UserArtifactLog(
      data.id,
      data.userId,
      data.artifactId,
      data.type,
      data.grade,
      data.amountUsd,
      data.details,
      data.createdAt,
    );
  }

  /**
   * 신규 로그 생성
   */
  static create(params: {
    id: bigint;
    userId?: bigint | null;
    artifactId?: bigint | null;
    type: ArtifactLogType;
    grade?: ArtifactGrade | null;
    createdAt: Date;
    amountUsd?: Prisma.Decimal | null;
    details?: UserArtifactLogDetails | null;
  }): UserArtifactLog {
    return new UserArtifactLog(
      params.id,
      params.userId ?? null,
      params.artifactId ?? null,
      params.type,
      params.grade ?? null,
      params.amountUsd ?? null,
      params.details ?? null,
      params.createdAt,
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint | null { return this._userId; }
  get artifactId(): bigint | null { return this._artifactId; }
  get type(): ArtifactLogType { return this._type; }
  get grade(): ArtifactGrade | null { return this._grade; }
  get amountUsd(): Prisma.Decimal | null { return this._amountUsd; }
  get details(): UserArtifactLogDetails | null { return this._details; }
  get createdAt(): Date { return this._createdAt; }
}
