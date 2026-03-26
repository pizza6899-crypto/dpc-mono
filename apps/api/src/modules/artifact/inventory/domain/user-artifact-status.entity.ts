/**
 * [Artifact] 유저별 유물 시스템 상태 정보 (인벤토리 슬롯 및 통계) 엔티티
 */
export class UserArtifactStatus {
  private constructor(
    private readonly _userId: bigint,
    private _activeSlotCount: number,
    private _totalDrawCount: bigint,
    private _totalSynthesisCount: bigint,
    private _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    userId: bigint;
    activeSlotCount: number;
    totalDrawCount: bigint;
    totalSynthesisCount: bigint;
    updatedAt: Date;
  }): UserArtifactStatus {
    return new UserArtifactStatus(
      data.userId,
      data.activeSlotCount,
      data.totalDrawCount,
      data.totalSynthesisCount,
      data.updatedAt,
    );
  }

  /**
   * 신규 유저를 위한 초기 상태 생성
   */
  static create(userId: bigint): UserArtifactStatus {
    return new UserArtifactStatus(
      userId,
      2, // 기본 슬롯 2개 제공
      0n,
      0n,
      new Date(),
    );
  }

  /**
   * 누적 뽑기 횟수 증가
   */
  increaseTotalDrawCount(count: number = 1): void {
    this._totalDrawCount += BigInt(count);
    this._updatedAt = new Date();
  }

  /**
   * 누적 합성 시도 횟수 증가
   */
  increaseTotalSynthesisCount(): void {
    this._totalSynthesisCount += 1n;
    this._updatedAt = new Date();
  }

  /**
   * 활성화된(해금된) 슬롯 개수 업데이트
   */
  updateActiveSlotCount(count: number): void {
    // 슬롯 개수는 음수일 수 없으며 최소 1개 이상 권장
    if (count < 1) return;
    this._activeSlotCount = count;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get userId(): bigint { return this._userId; }
  get activeSlotCount(): number { return this._activeSlotCount; }
  get totalDrawCount(): bigint { return this._totalDrawCount; }
  get totalSynthesisCount(): bigint { return this._totalSynthesisCount; }
  get updatedAt(): Date { return this._updatedAt; }
}
