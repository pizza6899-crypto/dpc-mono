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
    // 향후 추가될 네임스페이스들
}
