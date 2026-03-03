import type {
  TierEvaluationCycle,
  Language,
  ExchangeCurrencyCode,
} from '@prisma/client';
import type { Tier } from '../domain/tier.entity';

export interface UpdateTierProps {
  code: string;
  level?: number;
  upgradeExpRequired?: bigint | number | string;
  evaluationCycle?: TierEvaluationCycle;
  upgradeBonusWageringMultiplier?: number;
  rewardExpiryDays?: number | null;
  compRate?: number;
  weeklyLossbackRate?: number;
  monthlyLossbackRate?: number;
  dailyWithdrawalLimitUsd?: number;
  weeklyWithdrawalLimitUsd?: number;
  monthlyWithdrawalLimitUsd?: number;
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
  benefits?: {
    currency: ExchangeCurrencyCode;
    upgradeBonus: number | string;
    birthdayBonus: number | string;
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
