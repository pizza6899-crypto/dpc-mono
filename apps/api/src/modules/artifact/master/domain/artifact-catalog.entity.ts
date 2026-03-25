import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact] 유물 마스터 데이터 엔티티
 */
export class ArtifactCatalog {
  private constructor(
    private readonly _id: bigint,
    private readonly _code: string,
    private _grade: ArtifactGrade,
    private _drawWeight: number,
    private _casinoBenefit: number,
    private _slotBenefit: number,
    private _sportsBenefit: number,
    private _minigameBenefit: number,
    private _badBeatJackpot: number,
    private _criticalJackpot: number,
    private _imageUrl: string | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) { }

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
      data.casinoBenefit,
      data.slotBenefit,
      data.sportsBenefit,
      data.minigameBenefit,
      data.badBeatJackpot,
      data.criticalJackpot,
      data.imageUrl,
      data.createdAt,
      data.updatedAt,
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get code(): string { return this._code; }
  get grade(): ArtifactGrade { return this._grade; }
  get drawWeight(): number { return this._drawWeight; }
  get casinoBenefit(): number { return this._casinoBenefit; }
  get slotBenefit(): number { return this._slotBenefit; }
  get sportsBenefit(): number { return this._sportsBenefit; }
  get minigameBenefit(): number { return this._minigameBenefit; }
  get badBeatJackpot(): number { return this._badBeatJackpot; }
  get criticalJackpot(): number { return this._criticalJackpot; }
  get imageUrl(): string | null { return this._imageUrl; }
  get updatedAt(): Date { return this._updatedAt; }
}
