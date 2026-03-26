import { ArtifactGrade } from '@prisma/client';

export interface ArtifactStatsSummary {
  casinoBenefit: number;
  slotBenefit: number;
  sportsBenefit: number;
  minigameBenefit: number;
  badBeatBenefit: number;
  criticalBenefit: number;
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
    badBeatBenefit: number;
    criticalBenefit: number;
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
        badBeatBenefit: data.badBeatBenefit,
        criticalBenefit: data.criticalBenefit,
      },
      data.imageUrl,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 신규 유물 데이터 생성
   */
  static create(data: {
    code: string;
    grade: ArtifactGrade;
    drawWeight: number;
    stats: ArtifactStatsSummary;
    imageUrl?: string | null;
  }): ArtifactCatalog {
    const now = new Date();
    // 신규 생성 시 ID는 0n으로 초기화 (DB 저장 시 생성됨)
    return new ArtifactCatalog(
      0n,
      data.code,
      data.grade,
      data.drawWeight,
      data.stats,
      data.imageUrl ?? null,
      now,
      now,
    );
  }

  /**
   * 모든 능력치 합산 정보 제공
   */
  get statsSummary(): ArtifactStatsSummary {
    return { ...this._stats };
  }

  /**
   * 이미지 URL 업데이트
   */
  updateImageUrl(url: string | null): void {
    this._imageUrl = url;
    this._updatedAt = new Date();
  }

  /**
   * 유물 카탈로그 정보 업데이트
   */
  update(data: {
    code: string;
    grade: ArtifactGrade;
    drawWeight: number;
    stats: ArtifactStatsSummary;
  }): void {
    this._code = data.code;
    this._grade = data.grade;
    this._drawWeight = data.drawWeight;
    this._stats = { ...data.stats };
    this._updatedAt = new Date();
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
