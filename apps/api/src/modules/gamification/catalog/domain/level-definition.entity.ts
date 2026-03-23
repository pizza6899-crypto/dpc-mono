import type { TierCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

/**
 * [Gamification] 레벨 정의 마스터 데이터 도메인 엔티티
 * 
 * 특정 레벨에 도달하기 위한 필요 경험치(XP), 티어 정보,
 * 그리고 해당 레벨 도달 시 부여되는 보너스 스탯 포인트를 관리합니다.
 */
export class LevelDefinition {
  private constructor(
    private readonly _level: number,
    private readonly _requiredXp: Prisma.Decimal,
    private readonly _tierCode: TierCode,
    private readonly _tierImageUrl: string | null,
    private readonly _statPointsBoost: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    level: number;
    requiredXp: Prisma.Decimal;
    tierCode: TierCode;
    tierImageUrl: string | null;
    statPointsBoost: number;
    createdAt: Date;
    updatedAt: Date;
  }): LevelDefinition {
    return new LevelDefinition(
      data.level,
      data.requiredXp,
      data.tierCode,
      data.tierImageUrl,
      data.statPointsBoost,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 새로운 레벨 정의 생성
   */
  static create(params: {
    level: number;
    requiredXp: Prisma.Decimal;
    tierCode: TierCode;
    tierImageUrl?: string | null;
    statPointsBoost?: number;
  }): LevelDefinition {
    return new LevelDefinition(
      params.level,
      params.requiredXp,
      params.tierCode,
      params.tierImageUrl ?? null,
      params.statPointsBoost ?? 0,
      new Date(),
      new Date(),
    );
  }

  /**
   * 주어진 XP가 이 레벨에 계속 머무를 수 있는지 확인
   */
  isMaintainable(currentXp: Prisma.Decimal): boolean {
    return currentXp.greaterThanOrEqualTo(this._requiredXp);
  }

  // --- Getters ---

  get level(): number {
    return this._level;
  }

  get requiredXp(): Prisma.Decimal {
    return this._requiredXp;
  }

  get tierCode(): TierCode {
    return this._tierCode;
  }

  get tierImageUrl(): string | null {
    return this._tierImageUrl;
  }

  get statPointsBoost(): number {
    return this._statPointsBoost;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
