import { ArtifactGrade } from '@prisma/client';

export interface ArtifactStatsSummary {
  casinoBenefit: number;
  slotBenefit: number;
  sportsBenefit: number;
  minigameBenefit: number;
  badBeatJackpot: number;
  criticalJackpot: number;
}

/**
 * [Artifact] 유물 마스터 데이터 (도감) 엔티티
 */
export class ArtifactCatalog {
  private constructor(
    private readonly _id: bigint,
    private _code: string, // String -> string 수정
    private _grade: ArtifactGrade,
    private _drawWeight: number,
    private _stats: ArtifactStatsSummary,
    private _imageUrl: string | null,
    private _createdAt: Date,
    private _updatedAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate(data: {
    id: bigint;
    code: string;
    grade: ArtifactGrade;
    drawWeight: number;
    casinoBenefit: number;
    slotBenefit: number;
    sportsBenefit: number;
    minigameBenefit: number;
    badBeatJackpot: number;
    criticalJackpot: number;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ArtifactCatalog {
    return new ArtifactCatalog(
      data.id,
      data.code,
      data.grade,
      data.drawWeight,
      {
        casinoBenefit: data.casinoBenefit,
        slotBenefit: data.slotBenefit,
        sportsBenefit: data.sportsBenefit,
        minigameBenefit: data.minigameBenefit,
        badBeatJackpot: data.badBeatJackpot,
        criticalJackpot: data.criticalJackpot,
      },
      data.imageUrl,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 모든 능력치 합산 정보 제공
   */
  get statsSummary(): ArtifactStatsSummary {
    return { ...this._stats };
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get code(): string { return this._code; }
  get grade(): ArtifactGrade { return this._grade; }
  get drawWeight(): number { return this._drawWeight; }
  get imageUrl(): string | null { return this._imageUrl; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
