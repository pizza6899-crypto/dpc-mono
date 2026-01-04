/**
 * 문자열 및 객체 데이터를 안전하게 자르고 정제하는 유틸리티
 */

/**
 * 주어진 데이터가 너무 길 경우 자릅니다.
 *
 * @param data 문자열 또는 객체/배열
 * @param maxLength 최대 길이 (기본값: 4096자)
 * @returns 잘린 문자열 또는 원본 데이터
 */
export function sanitizeAndTruncate(data: any, maxLength = 4096): any {
    if (data === undefined || data === null) {
        return data;
    }

    // 문자열인 경우
    if (typeof data === 'string') {
        if (data.length <= maxLength) {
            return data;
        }
        return `${data.slice(0, maxLength)} ... (truncated, total: ${data.length} chars)`;
    }

    // 객체나 배열인 경우
    if (typeof data === 'object') {
        try {
            const stringified = JSON.stringify(data);
            if (stringified.length <= maxLength) {
                return data; // 원본 객체 반환 (굳이 문자열로 변환하지 않음)
            }
            // 길이가 넘으면 문자열로 변환 후 자름
            return `${stringified.slice(0, maxLength)} ... (truncated, total: ${stringified.length} chars)`;
        } catch (e) {
            return '[Circular or Non-Serializable Data]';
        }
    }

    // 그 외(숫자, 불리언 등)는 그대로 반환
    return data;
}
