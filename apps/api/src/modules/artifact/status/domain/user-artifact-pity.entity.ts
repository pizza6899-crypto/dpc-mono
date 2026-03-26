import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact] 유저별 등급별 유물 획득 및 합성 통계 (Pity/History) 엔티티
 */
export class UserArtifactPity {
  private constructor(
    private readonly _userId: bigint,
    private readonly _grade: ArtifactGrade,
    private _synthesisFailureCount: number,
    private _synthesisTotalFailureCount: number,
    private _drawTotalObtainCount: number,
    private _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    userId: bigint;
    grade: ArtifactGrade;
    synthesisFailureCount: number;
    synthesisTotalFailureCount: number;
    drawTotalObtainCount: number;
    updatedAt: Date;
  }): UserArtifactPity {
    return new UserArtifactPity(
      data.userId,
      data.grade,
      data.synthesisFailureCount,
      data.synthesisTotalFailureCount,
      data.drawTotalObtainCount,
      data.updatedAt,
    );
  }

  /**
   * 특정 유저/등급 조합의 초기 Pity 객체 생성
   */
  static create(userId: bigint, grade: ArtifactGrade): UserArtifactPity {
    return new UserArtifactPity(
      userId,
      grade,
      0,
      0,
      0,
      new Date(),
    );
  }

  /**
   * 합성 실패 시 카운트 증가
   */
  increaseSynthesisFailure(): void {
    this._synthesisFailureCount += 1;
    this._synthesisTotalFailureCount += 1;
    this._updatedAt = new Date();
  }

  /**
   * 합성 성공 시 연속 실패 카운트 초기화
   */
  resetSynthesisFailure(): void {
    this._synthesisFailureCount = 0;
    this._updatedAt = new Date();
  }

  /**
   * 뽑기로 인한 획득 횟수 증가
   */
  increaseDrawObtainCount(): void {
    this._drawTotalObtainCount += 1;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get userId(): bigint { return this._userId; }
  get grade(): ArtifactGrade { return this._grade; }
  get synthesisFailureCount(): number { return this._synthesisFailureCount; }
  get synthesisTotalFailureCount(): number { return this._synthesisTotalFailureCount; }
  get drawTotalObtainCount(): number { return this._drawTotalObtainCount; }
  get updatedAt(): Date { return this._updatedAt; }
}
