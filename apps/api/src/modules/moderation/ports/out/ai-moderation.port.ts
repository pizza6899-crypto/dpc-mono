export const AI_MODERATION_PORT = 'AI_MODERATION_PORT';

/**
 * AI 모더레이션 검토 결과
 */
export interface AiModerationResult {
    isAllowed: boolean;
    message: string;
    /** 대표 라벨 (e.g. 'Hate', 'Violence', 'Clean') */
    label?: string;
    /** 판단 신뢰도 (0.0 ~ 1.0) */
    confidence?: number;
    /** 부적절 판정 시 감지된 문제 단어/표현 목록 */
    flaggedWords?: string[];
    /** 원본 응답 (디버깅용) */
    raw?: any;
    /** 소요 시간 (ms) */
    durationMs?: number;
    /** 사용된 공급자 */
    provider?: string;
    /** 사용된 모델명 */
    model?: string;
}

/**
 * AI 모더레이션 아웃바운드 포트
 *
 * 외부 AI API(OpenAI Moderation, Claude 등)와의 통신을 추상화합니다.
 */
export interface AiModerationPort {
    /**
     * 텍스트 콘텐츠에 대한 AI 검토를 수행합니다.
     */
    check(content: string): Promise<AiModerationResult>;
}
