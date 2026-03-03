import type { TierEvaluationCycle, Language, Prisma } from '@prisma/client';
import type { Tier } from '../domain/tier.entity';

export interface UpdateTierProps {
  code: string;
  level?: number;
  upgradeExpRequired?: bigint;
  evaluationCycle?: TierEvaluationCycle;
  upgradeBonusWageringMultiplier?: number | Prisma.Decimal;
  rewardExpiryDays?: number | null;
  compRate?: number | Prisma.Decimal;
  weeklyLossbackRate?: number | Prisma.Decimal;
  monthlyLossbackRate?: number | Prisma.Decimal;
  dailyWithdrawalLimitUsd?: number | Prisma.Decimal;
  weeklyWithdrawalLimitUsd?: number | Prisma.Decimal;
  monthlyWithdrawalLimitUsd?: number | Prisma.Decimal;
  isWithdrawalUnlimited?: boolean;
  hasDedicatedManager?: boolean;
  isActive?: boolean;
  isHidden?: boolean;
  isManualOnly?: boolean;
  imageUrl?: string | null;
  imageFileId?: string | null;
  translations?: {
    language: Language;
    name: string;
    description?: string | null;
  }[];
  updatedBy: bigint;
}

export abstract class TierRepositoryPort {
  abstract findAll(options?: { ignoreCache?: boolean }): Promise<Tier[]>;
  abstract findByLevel(level: number): Promise<Tier | null>;
  abstract findByCode(code: string): Promise<Tier | null>;
  abstract findNextTierByLevel(level: number): Promise<Tier | null>;
  abstract update(props: UpdateTierProps): Promise<Tier>;
}
