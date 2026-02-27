/**
 * 시스템 예약어 (아이디/닉네임 사칭 방지용)
 */
export const RESERVED_WORDS = [
    'admin',
    'administrator',
    'system',
    'root',
    'support',
    'official',
    'manager',
    'operator',
    'moderator',
    'master',
    'webmaster',
    'staff',
    'help',
    'service',
    'api',
    'null',
    'undefined',
    'guest',
    'anonymous',
    'internal',
    'security',
    'dpc', // 브랜드명 보호
];

/**
 * 콘텐츠 검토 결과 타입
 */
export type ModerationResultType =
    | 'ALLOWED'           // 허용
    | 'RESERVED_WORD'     // 예약어/사칭
    | 'PROFANITY'        // 비속어
    | 'AI_REJECTED'      // AI 판정 부적절
    | 'FORMAT_ERROR';     // 형식 오류

export interface ModerationResult {
    isAllowed: boolean;
    type: ModerationResultType;
    message: string;
}
