/**
 * [Artifact] 유저의 유물 소유 정보 엔티티
 */
export class UserArtifact {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint,
    private readonly _artifactId: bigint,
    private _slotNo: number | null,
    private _isEquipped: boolean,
    private readonly _acquiredAt: Date,
    private _updatedAt: Date,
  ) { }

  static rehydrate(data: {
    id: bigint;
    userId: bigint;
    artifactId: bigint;
    slotNo: number | null;
    isEquipped: boolean;
    acquiredAt: Date;
    updatedAt: Date;
  }): UserArtifact {
    return new UserArtifact(
      data.id,
      data.userId,
      data.artifactId,
      data.slotNo,
      data.isEquipped,
      data.acquiredAt,
      data.updatedAt,
    );
  }

  /**
   * 유물 장착
   */
  equip(slotNo: number): void {
    this._slotNo = slotNo;
    this._isEquipped = true;
    this._updatedAt = new Date();
  }

  /**
   * 유물 해제
   */
  unequip(): void {
    this._slotNo = null;
    this._isEquipped = false;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint { return this._userId; }
  get artifactId(): bigint { return this._artifactId; }
  get slotNo(): number | null { return this._slotNo; }
  get isEquipped(): boolean { return this._isEquipped; }
  get acquiredAt(): Date { return this._acquiredAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
