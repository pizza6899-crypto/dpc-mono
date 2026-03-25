import { ArtifactGrade, Prisma } from '@prisma/client';

/**
 * [Artifact] 유물 등급별 뽑기(Gacha) 확률 설정 엔티티
 */
export class ArtifactDrawConfig {
  private constructor(
    private readonly _grade: ArtifactGrade,
    private _probability: Prisma.Decimal,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    grade: ArtifactGrade;
    probability: Prisma.Decimal;
  }): ArtifactDrawConfig {
    return new ArtifactDrawConfig(data.grade, data.probability);
  }

  /**
   * 확률 정수로 변환 (계산 편의성 위함, e.g. 0.05 -> 5)
   */
  get probabilityValue(): number {
    return this._probability.toNumber();
  }

  // --- Getters ---
  get grade(): ArtifactGrade { return this._grade; }
  get probability(): Prisma.Decimal { return this._probability; }
}
