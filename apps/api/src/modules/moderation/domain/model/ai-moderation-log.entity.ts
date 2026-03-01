/**
 * AiModerationLog 도메인 엔티티
 * 
 * AI 모더레이션 검사 이력을 표현하는 도메인 엔티티입니다.
 */
export class AiModerationLog {
    private constructor(
        public readonly id: bigint,
        public readonly input: string,
        public readonly isAllowed: boolean,
        public readonly label: string | null,
        public readonly confidence: number | null,
        public readonly reason: string | null,
        public readonly flaggedWords: string[],
        public readonly rawResponse: any | null,
        public readonly provider: string | null,
        public readonly model: string | null,
        public readonly durationMs: number | null,
        public readonly createdAt: Date,
    ) { }

    /**
     * DB에서 조회한 데이터로부터 엔티티 생성
     */
    static fromPersistence(data: {
        id: bigint;
        input: string;
        isAllowed: boolean;
        label: string | null;
        confidence: number | null;
        reason: string | null;
        flaggedWords: string[];
        rawResponse: any | null;
        provider: string | null;
        model: string | null;
        durationMs: number | null;
        createdAt: Date;
    }): AiModerationLog {
        return new AiModerationLog(
            data.id,
            data.input,
            data.isAllowed,
            data.label,
            data.confidence,
            data.reason,
            data.flaggedWords,
            data.rawResponse,
            data.provider,
            data.model,
            data.durationMs,
            data.createdAt,
        );
    }

    /**
     * 신규 로그 생성을 위한 팩토리 메서드
     */
    static create(props: {
        id: bigint; // Snowflake ID (Application Generated)
        input: string;
        isAllowed: boolean;
        label?: string;
        confidence?: number;
        reason?: string;
        flaggedWords?: string[];
        rawResponse?: any;
        provider?: string;
        model?: string;
        durationMs?: number;
        createdAt: Date;
    }): AiModerationLog {
        return new AiModerationLog(
            props.id,
            props.input,
            props.isAllowed,
            props.label || null,
            props.confidence || null,
            props.reason || null,
            props.flaggedWords || [],
            props.rawResponse || null,
            props.provider || null,
            props.model || null,
            props.durationMs || null,
            props.createdAt,
        );
    }
}
