import { ExchangeCurrencyCode, Prisma } from '@prisma/client';

export type ArtifactDrawPriceTable = Record<'SINGLE' | 'TEN', Partial<Record<ExchangeCurrencyCode, number>>>;

/**
 * [Artifact] 유물 정책 및 가챠 비용 설정 엔티티
 */
export class ArtifactPolicy {
  static readonly POLICY_ID = 1;

  private constructor(
    private readonly _id: number,
    private _drawPrices: ArtifactDrawPriceTable,
    private _maxEquipLimit: number,
    private _updatedAt: Date,
  ) { }

  static rehydrate(data: {
    id: number;
    drawPrices: any; // Prisma Json
    maxEquipLimit: number;
    updatedAt: Date;
  }): ArtifactPolicy {
    return new ArtifactPolicy(
      data.id,
      (data.drawPrices || {}) as ArtifactDrawPriceTable,
      data.maxEquipLimit,
      data.updatedAt,
    );
  }

  getDrawPrice(type: 'SINGLE' | 'TEN', currency: ExchangeCurrencyCode): Prisma.Decimal | null {
    const price = this._drawPrices[type]?.[currency];
    if (price === undefined) return null;
    return new Prisma.Decimal(price);
  }

  // --- Getters ---
  get id(): number { return this._id; }
  get maxEquipLimit(): number { return this._maxEquipLimit; }
  get drawPrices(): ArtifactDrawPriceTable { return { ...this._drawPrices }; }
  get updatedAt(): Date { return this._updatedAt; }
}
