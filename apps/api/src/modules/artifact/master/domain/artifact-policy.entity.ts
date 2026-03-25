import { ArtifactGrade, ExchangeCurrencyCode, Prisma } from '@prisma/client';

export type ArtifactDrawPriceTable = Record<'SINGLE' | 'TEN', Partial<Record<ExchangeCurrencyCode, number>>>;

export interface ArtifactSynthesisConfig {
  requiredCount: number;
  successRate: number; // 0.0 ~ 1.0
}

export type ArtifactSynthesisConfigTable = Partial<Record<ArtifactGrade, ArtifactSynthesisConfig>>;

export interface ArtifactSlotUnlockConfig {
  unlockLevels: number[]; // e.g. [1, 1, 50, 100]
}

/**
 * [Artifact] 유물 정책 및 가챠/합성/해금 설정 엔티티
 */
export class ArtifactPolicy {
  static readonly POLICY_ID = 1;

  private constructor(
    private readonly _id: number,
    private _drawPrices: ArtifactDrawPriceTable,
    private _synthesisConfigs: ArtifactSynthesisConfigTable,
    private _slotUnlockConfigs: ArtifactSlotUnlockConfig,
    private _maxEquipLimit: number,
    private _updatedAt: Date,
  ) { }

  static rehydrate(data: {
    id: number;
    drawPrices: any; // Prisma Json
    synthesisConfigs: any; // Prisma Json
    slotUnlockConfigs: any; // Prisma Json
    maxEquipLimit: number;
    updatedAt: Date;
  }): ArtifactPolicy {
    return new ArtifactPolicy(
      data.id,
      (data.drawPrices || {}) as ArtifactDrawPriceTable,
      (data.synthesisConfigs || {}) as ArtifactSynthesisConfigTable,
      (data.slotUnlockConfigs || { unlockLevels: [1, 1] }) as ArtifactSlotUnlockConfig,
      data.maxEquipLimit,
      data.updatedAt,
    );
  }

  /**
   * 뽑기 비용 조회
   */
  getDrawPrice(type: 'SINGLE' | 'TEN', currency: ExchangeCurrencyCode): Prisma.Decimal | null {
    const price = this._drawPrices[type]?.[currency];
    if (price === undefined) return null;
    return new Prisma.Decimal(price);
  }

  /**
   * 특정 등급의 합성 정책 조회
   */
  getSynthesisConfig(grade: ArtifactGrade): ArtifactSynthesisConfig | null {
    return this._synthesisConfigs[grade] || null;
  }

  /**
   * 합성 성공 여부 판단
   */
  isSynthesisSuccessful(grade: ArtifactGrade): boolean {
    const config = this.getSynthesisConfig(grade);
    if (!config) return false;
    return Math.random() < config.successRate;
  }

  /**
   * 다음 등급 결정 로직 (일반 -> 고급 -> 희귀 -> 영웅 -> 전설 -> 신화 -> 유일)
   */
  getNextGrade(currentGrade: ArtifactGrade): ArtifactGrade | null {
    const grades: ArtifactGrade[] = [
      ArtifactGrade.COMMON,
      ArtifactGrade.UNCOMMON,
      ArtifactGrade.RARE,
      ArtifactGrade.EPIC,
      ArtifactGrade.LEGENDARY,
      ArtifactGrade.MYTHIC,
      ArtifactGrade.UNIQUE,
    ];
    const currentIndex = grades.indexOf(currentGrade);
    if (currentIndex === -1 || currentIndex === grades.length - 1) return null;
    return grades[currentIndex + 1];
  }

  /**
   * 유저의 현재 레벨에 따라 사용 가능한 슬롯 개수 계산
   */
  getAvailableSlotCount(userLevel: number): number {
    const unlockLevels = this._slotUnlockConfigs.unlockLevels || [1, 1];
    
    // 유저 레벨이 해금 레벨보다 크거나 같은 슬롯들만 필터링
    const unlockedCount = unlockLevels.filter(lvl => userLevel >= lvl).length;
    
    // maxEquipLimit(시스템 최대 상한)을 넘지 않도록 제한
    return Math.min(unlockedCount, this._maxEquipLimit);
  }

  // --- Getters ---
  get id(): number { return this._id; }
  get maxEquipLimit(): number { return this._maxEquipLimit; }
  get drawPrices(): ArtifactDrawPriceTable { return { ...this._drawPrices }; }
  get synthesisConfigs(): ArtifactSynthesisConfigTable { return { ...this._synthesisConfigs }; }
  get slotUnlockConfigs(): ArtifactSlotUnlockConfig { return { ...this._slotUnlockConfigs }; }
  get updatedAt(): Date { return this._updatedAt; }
}
