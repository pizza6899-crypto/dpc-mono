import { ArtifactGrade, ArtifactLogType } from '@prisma/client';

/**
 * [Audit] 유물 활동 상세 내역 (타입별 전용 인터페이스)
 */

// 1. 뽑기 및 쿠폰 (DRAW, COUPON_DRAW)
export interface DrawLogDetails {
  isTicketUsed: boolean;
  pityApplied: boolean;
  costUsd?: number;
  couponCode?: string;
}

// 2. 장착 및 해제 (EQUIP, UNEQUIP)
export interface EquipLogDetails {
  slotNo: number;
  previousArtifactId?: bigint | null;
}

// 3. 합성 (SYNTHESIS)
export interface SynthesisLogDetails {
  consumedArtifactIds: bigint[];
  isSuccess: boolean;
  pityApplied: boolean;
  costUsd?: number;
}

// 4. 관리자 유물 지급/회수 (ADMIN_GRANT, ADMIN_REVOKE)
export interface AdminArtifactActionDetails {
  adminId: bigint;
  reason: string;
}

// 5. 관리자 티켓 수량 조정 (ADMIN_TICKET_MODIFY)
export interface AdminTicketModifyDetails {
  adminId: bigint;
  reason: string;
  ticketType: 'ALL' | ArtifactGrade;
  beforeCount: number;
  afterCount: number;
}

/**
 * [Audit] 유물 활동 타입별 상세 내역 유니온 타입
 */
export type UserArtifactLogDetails =
  | DrawLogDetails
  | EquipLogDetails
  | SynthesisLogDetails
  | AdminArtifactActionDetails
  | AdminTicketModifyDetails;

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
    details: UserArtifactLogDetails | null;
    createdAt: Date;
  }): UserArtifactLog {
    return new UserArtifactLog(
      data.id,
      data.userId,
      data.artifactId,
      data.type,
      data.grade,
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
    details?: UserArtifactLogDetails | null;
  }): UserArtifactLog {
    return new UserArtifactLog(
      params.id,
      params.userId ?? null,
      params.artifactId ?? null,
      params.type,
      params.grade ?? null,
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
  get details(): UserArtifactLogDetails | null { return this._details; }
  get createdAt(): Date { return this._createdAt; }
}
