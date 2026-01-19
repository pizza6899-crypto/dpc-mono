/**
 * Whitecliff 외부 통화 코드와 내부 시스템 통화 코드 간의 매핑
 * Key: 외부 통화 코드 (Whitecliff)
 * Value: 내부 통화 코드 (System)
 * 
 * 예: Whitecliff는 테더를 'TET'라고 부르지만 내부는 'USDT'를 사용
 */
export const WHITECLIFF_CURRENCY_MAPPING: Record<string, string> = {
    'TET': 'USDT',
};
