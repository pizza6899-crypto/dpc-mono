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
    AGGREGATOR: {
      BY_ID: (id: bigint) => ({
        key: `casino:aggregator:id:${id}`,
        ttlSeconds: 60,
        store: CacheStore.MEMORY,
      }),
      BY_CODE: (code: string) => ({
        key: `casino:aggregator:code:${code}`,
        ttlSeconds: 60,
        store: CacheStore.MEMORY,
      }),
    },
    PROVIDER: {
      BY_ID: (id: bigint) => ({
        key: `casino:provider:id:${id}`,
        ttlSeconds: 60,
        store: CacheStore.MEMORY,
      }),
      BY_CODE: (aggregatorId: bigint, code: string) => ({
        key: `casino:provider:code:${aggregatorId}:${code}`,
        ttlSeconds: 60,
        store: CacheStore.MEMORY,
      }),
      BY_EXTERNAL_ID: (aggregatorId: bigint, externalId: string) => ({
        key: `casino:provider:ext:${aggregatorId}:${externalId}`,
        ttlSeconds: 60,
        store: CacheStore.MEMORY,
      }),
    },
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
  /**
   * 채팅 설정 관련 (ChatConfig)
   */
  CHAT_CONFIG: {
    GLOBAL: {
      key: 'chat:config:global',
      ttlSeconds: 60, // 1분 L1 캐시
      store: CacheStore.MEMORY,
    },
  },
  /**
   * 파일 관련 (File)
   */
  FILE: {
    URL: (fileId: string | bigint) => ({
      key: `file:url:${fileId}`,
      ttlSeconds: 86400, // 24시간 (PUBLIC 기준)
      store: CacheStore.REDIS,
    }),
    PRIVATE_URL: (fileId: string | bigint) => ({
      key: `file:url:private:${fileId}`,
      ttlSeconds: 1800, // 30분 (Presigned URL 만료시간보다 짧게 설정)
      store: CacheStore.REDIS,
    }),
  },
  /**
   * 프로모션 관련
   */
  PROMOTION: {
    CONFIG: {
      key: 'promotion:config:global',
      ttlSeconds: 60, // 1분
      store: CacheStore.MEMORY,
    },
  },
  /**
   * 쿠폰 관련
   */
  COUPON: {
    CONFIG: {
      key: 'coupon:config:global',
      ttlSeconds: 60, // 1분
      store: CacheStore.MEMORY,
    },
  },
} as const;
