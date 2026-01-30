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
     * 유저 프로필/상태 관련 (예시)
     */
    USER: {
        PROFILE: (id: string | bigint) => ({
            key: `user:profile:${id}`,
            ttlSeconds: 3600, // 1시간
            store: CacheStore.REDIS,
        }),
    },

    /**
     * 실시간 보안/인증 관련 (예시)
     */
    AUTH: {
        SESSION: (token: string) => ({
            key: `auth:session:${token}`,
            ttlSeconds: 86400, // 1일
            store: CacheStore.REDIS,
        }),
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
} as const;
