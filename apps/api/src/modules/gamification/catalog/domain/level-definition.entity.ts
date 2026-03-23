import { Prisma, TierCode } from '@prisma/client';
import { MessageCode } from '@repo/shared';
import { InvalidGamificationConfigParameterException } from './catalog.exception';

/**
 * [Gamification] 레벨 정의 도메인 엔티티
 * 
 * 특정 레벨에 도달하기 위한 필요 경험치(Required XP)와
 * 해당 레벨 도달 시의 티어 분류 및 보상 정책을 정의합니다.
 */
export class LevelDefinition {
  private constructor(
    private readonly _level: number,
    private _requiredXp: Prisma.Decimal,
    private _tierCode: TierCode,
    private _tierImageUrl: string | null,
    private _statPointsBoost: number,
    private readonly _updatedAt: Date,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    level: number;
    requiredXp: Prisma.Decimal;
    tierCode: TierCode;
    tierImageUrl: string | null;
    statPointsBoost: number;
    updatedAt: Date;
  }): LevelDefinition {
    return new LevelDefinition(
      data.level,
      data.requiredXp,
      data.tierCode,
      data.tierImageUrl,
      data.statPointsBoost,
      data.updatedAt,
    );
  }

  /**
   * 레벨 설정 업데이트
   */
  update(params: {
    requiredXp?: Prisma.Decimal;
    tierCode?: TierCode;
    tierImageUrl?: string | null;
    statPointsBoost?: number;
  }): void {
    if (params.requiredXp !== undefined) {
      if (params.requiredXp.isNegative()) {
        throw new InvalidGamificationConfigParameterException(MessageCode.GAMIFICATION_LEVEL_REQUIRED_XP_NEGATIVE, 'Required XP cannot be negative.');
      }
      this._requiredXp = params.requiredXp;
    }

    if (params.tierCode !== undefined) {
      this._tierCode = params.tierCode;
    }

    if (params.tierImageUrl !== undefined) {
      this._tierImageUrl = params.tierImageUrl;
    }

    if (params.statPointsBoost !== undefined) {
      if (params.statPointsBoost < 0) {
        throw new InvalidGamificationConfigParameterException(MessageCode.GAMIFICATION_LEVEL_STAT_BOOST_NEGATIVE, 'Stat points boost cannot be negative.');
      }
      this._statPointsBoost = params.statPointsBoost;
    }
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

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
