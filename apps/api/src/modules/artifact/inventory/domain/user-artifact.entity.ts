/**
 * [Artifact] 유저가 보유한 개별 유물 인스턴스 엔티티
 */
export class UserArtifact {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint,
    private readonly _artifactId: bigint,
    private _slotNo: number | null,
    private _isEquipped: boolean,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint;
    artifactId: bigint;
    slotNo: number | null;
    isEquipped: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserArtifact {
    return new UserArtifact(
      data.id,
      data.userId,
      data.artifactId,
      data.slotNo,
      data.isEquipped,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 신규 획득 유물 생성용 팩토리 메서드
   */
  static create(userId: bigint, artifactId: bigint): UserArtifact {
    const now = new Date();
    return new UserArtifact(
      0n, // DB 저장 시 자동 생성
      userId,
      artifactId,
      null,
      false,
      now,
      now,
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint { return this._userId; }
  get artifactId(): bigint { return this._artifactId; }
  get slotNo(): number | null { return this._slotNo; }
  get isEquipped(): boolean { return this._isEquipped; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
