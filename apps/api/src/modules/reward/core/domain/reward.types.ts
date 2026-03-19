import { WageringCalculationMethod } from '@prisma/client';

// 1. 메타데이터 (JSON) 속 타입들
export enum RewardMetadataType {
  TRANSLATION = 'TRANSLATION',
  FREE_SPIN = 'FREE_SPIN',
  PROMOTION = 'PROMOTION',
}

export interface TranslationMetadata {
  type: RewardMetadataType.TRANSLATION;
  translationKey: string;
  templateParams?: Record<string, string | number>;
}

export interface FreeSpinMetadata {
  type: RewardMetadataType.FREE_SPIN;
  provider: string;
  gameId: string;
  ticketToken: string;
}

export interface PromotionMetadata {
  type: RewardMetadataType.PROMOTION;
  depositAmount?: string;
  depositId?: string;
  promotionId?: string;
  wageringCalculationMethod?: WageringCalculationMethod;
}

export type RewardMetadata =
  | TranslationMetadata
  | FreeSpinMetadata
  | PromotionMetadata;
