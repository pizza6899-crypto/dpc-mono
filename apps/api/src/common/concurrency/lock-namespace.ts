/**
 * PostgreSQL Advisory Lock을 위한 네임스페이스 정의
 *
 * 64비트 정수 중 첫 번째 32비트 키로 사용됩니다.
 * 각 모듈별로 고유한 값을 할당하여 충돌을 방지합니다.
 */
export enum LockNamespace {
    AFFILIATE_CODE = 1001,
    TIER_CREATION = 1002,
    USER_TIER = 1003,
    // 향후 추가될 네임스페이스들
}
