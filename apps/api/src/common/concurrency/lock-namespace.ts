import { sql, RawBuilder } from 'kysely';

/**
 * PostgreSQL Advisory Lock을 위한 네임스페이스 정의
 *
 * 64비트 정수 중 첫 번째 32비트 키로 사용됩니다.
 * 각 모듈별로 고유한 값을 할당하여 충돌을 방지합니다.
 */
export enum LockNamespace {
    AFFILIATE_CODE = 1001, // 유저별
    TIER_CREATION = 1002, // 어드민 레벨에서 공통으로 사용
    USER_TIER = 1003,
    USER_WALLET = 1004,
    DEPOSIT = 1005,
    USER_DEPOSIT = 1006,
    COMP_WALLET = 1007,
    PROMOTION = 1008,

    // Casino
    GAME_ROUND = 2002,
    // 향후 추가될 네임스페이스들
}

export const CONCURRENCY_CONSTANTS = {
    // Database Advisory Lock Timeout
    // Sets the maximum time to wait for a lock before throwing an error.
    // This prevents indefinite blocking if a transaction hangs.
    DB_LOCK_TIMEOUT: '3s',
};

export const DbLockUtil = {
    /**
     * PG Advisory Lock을 위한 64비트 정수 키를 생성합니다.
     * 네임스페이스와 식별자를 MD5 해싱하여 충돌을 방지하면서도 결정론적인 키를 생성합니다.
     */
    generateAdvisoryLockKey(namespace: LockNamespace, id: string): RawBuilder<bigint> {
        // md5 결과를 16진수 비트로 변환하여 64비트 bigint로 캐스팅 (Advisory Lock 규격)
        return sql`('x' || substr(md5(${namespace}::text || ${id}), 1, 16))::bit(64)::bigint`;
    },

    /**
     * 발생한 에러가 DB 락 타임아웃(55P03)인지 확인합니다.
     */
    isLockTimeout(error: any): boolean {
        return (
            error.code === '55P03' ||
            error.meta?.code === '55P03' ||
            error.message?.includes('55P03') ||
            error.message?.includes('lock timeout')
        );
    },
};

