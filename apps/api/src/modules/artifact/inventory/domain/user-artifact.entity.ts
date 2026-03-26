/**
 * [Artifact] 유저가 소유한 개별 유물 인스턴스 엔티티
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

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
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
   * 신규 유물 획득 생성
   */
  static create(params: {
    userId: bigint;
    artifactId: bigint;
  }): UserArtifact {
    const now = new Date();
    return new UserArtifact(
      0n, // DB 저장 전 ID
      params.userId,
      params.artifactId,
      null, // 초기 획득 시 미장착
      false,
      now,
      now,
    );
  }

  /**
   * 특정 슬롯에 유물 장착
   * @param slotNo 장착할 슬롯 번호 (1~N)
   */
  equip(slotNo: number): void {
    if (slotNo < 1) return;
    this._slotNo = slotNo;
    this._isEquipped = true;
    this._updatedAt = new Date();
  }

  /**
   * 유물 장착 해제
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
