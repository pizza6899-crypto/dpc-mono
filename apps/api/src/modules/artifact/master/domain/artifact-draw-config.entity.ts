import { ArtifactGrade, Prisma } from '@prisma/client';

/**
 * [Artifact] 유물 등급별 뽑기(Gacha) 확률 설정 엔티티
 */
export class ArtifactDrawConfig {
  private constructor(
    private readonly _grade: ArtifactGrade,
    private _probability: Prisma.Decimal,
    private _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    grade: ArtifactGrade;
    probability: Prisma.Decimal;
    updatedAt: Date;
  }): ArtifactDrawConfig {
    return new ArtifactDrawConfig(data.grade, data.probability, data.updatedAt);
  }

  // --- Getters ---
  get grade(): ArtifactGrade { return this._grade; }
  get probability(): Prisma.Decimal { return this._probability; }
  get updatedAt(): Date { return this._updatedAt; }
}
