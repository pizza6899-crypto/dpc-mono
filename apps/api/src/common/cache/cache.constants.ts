import { CacheStore } from './cache.service';

export interface CacheDefinition {
  key: string;
  ttlSeconds: number;
  store: CacheStore;
}

/**
 * 전역 캐시 설정 중앙 관리
 */
export const CACHE_CONFIG = {
  /**
   * 티어 마스터 관련
   */
  TIER: {
    LIST: {
      key: 'tier:all',
      ttlSeconds: 300, // 5분
      store: CacheStore.MEMORY,
    },
    SETTINGS: {
      key: 'tier:settings',
      ttlSeconds: 60, // 1분
      store: CacheStore.MEMORY,
    },
  },

  /**
   * 카지노 관련
   */
  CASINO: {
    WHITECLIFF_PROCESSED_TIME: (currency: string, prdId: number) => ({
      key: `whitecliff:pushed-bet-history:last-processed:${currency}:${prdId}`,
      ttlSeconds: 86400, // 24시간
      store: CacheStore.REDIS,
    }),
  },
  /**
   * 웨이저링 관련
   */
  WAGERING: {
    CONFIG: {
      key: 'wagering:config:global',
      ttlSeconds: 60, // 1분
      store: CacheStore.MEMORY,
    },
  },

  /**
   * 사용자 설정 관련 (UserConfig)
   * 숏텀 메모리 캐시 (L1)
   */
  USER_CONFIG: {
    GLOBAL: {
      key: 'user:config:global',
      ttlSeconds: 5, // 5초 L1 캐시
      store: CacheStore.MEMORY,
    },
  },
} as const;
