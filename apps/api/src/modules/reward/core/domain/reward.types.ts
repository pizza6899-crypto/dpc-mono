// src/modules/reward/domain/reward.types.ts

// 1. 메타데이터 (JSON) 속 타입들
export enum RewardMetadataType {
  TRANSLATION = 'TRANSLATION',
  FREE_SPIN = 'FREE_SPIN',
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

export type RewardMetadata = TranslationMetadata | FreeSpinMetadata;
