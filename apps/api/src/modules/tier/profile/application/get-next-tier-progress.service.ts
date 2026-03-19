import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { UserTier } from '../domain/user-tier.entity';
import { Tier } from '../../config/domain/tier.entity';

export interface NextTierProgressResult {
  id: bigint;
  name: string;
  imageUrl: string | null;
  requiredExp: bigint;
  currentExp: bigint;
  remainingExp: bigint;
  progressPercent: number;
}

@Injectable()
export class GetNextTierProgressService {
  /**
   * 유저의 현재 티어 정보를 바탕으로 다음 티어 승급 진행률을 계산합니다.
   * 엔티티를 직접 전달받아 DB 조회를 최소화합니다.
   */
  execute(
    userTier: UserTier,
    nextTier: Tier | null,
    language: Language = Language.EN,
  ): NextTierProgressResult | null {
    if (!userTier.tier || !nextTier) return null;

    // [Policy] Promotion progress is calculated based on statusExp
    const requiredExp = nextTier.upgradeExpRequired;
    const currentExp = userTier.statusExp;
    const remainingExp =
      requiredExp > currentExp ? requiredExp - currentExp : 0n;

    const progress =
      requiredExp > 0n ? Number((currentExp * 100n) / requiredExp) : 100;

    return {
      id: nextTier.id,
      name: nextTier.getName(language),
      imageUrl: nextTier.imageUrl,
      requiredExp,
      currentExp,
      remainingExp,
      progressPercent: Math.min(100, Math.max(0, progress)),
    };
  }
}
