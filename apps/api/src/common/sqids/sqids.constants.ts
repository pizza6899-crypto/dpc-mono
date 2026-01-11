/**
 * Sqid와 접두사 사이의 구분자
 */
export const SQIDS_DELIMITER = '_';

/**
 * Sqids 인코딩 시 사용할 접두사 라벨 정의
 */
export const SqidsPrefix = {
    USER: 'u',
    DEPOSIT: 'd',
    WITHDRAWAL: 'w',
    TRANSACTION: 'tx',
    AFFILIATE_CODE: 'ac',
    USER_TIER: 'ut',
    TIER: 't',
    // 필요에 따라 추가
} as const;

export type SqidsPrefixType = typeof SqidsPrefix[keyof typeof SqidsPrefix];

/**
 * Knuth's Multiplicative Hash (64-bit)를 위한 상수
 * 자동 증가 정수(Sequential ID)를 비트 공간상에 무작위로 재배치하여 추측을 불가능하게 합니다.
 * 
 * ⚠️ WARNING: 이 값들을 변경하면 기존에 생성된 모든 Sqid를 디코딩할 수 없게 됩니다.
 * 서비스 시작 후에는 절대 변경하지 마세요.
 */
export const KNUTH_PRIME = 6364136223846793005n;
export const KNUTH_INVERSE = 13877824140714322085n;
export const KNUTH_MASK = (1n << 64n) - 1n;
