/**
 * ForbiddenWord 도메인 엔티티
 * 
 * 시스템 예약어 및 차단 단어 정보를 표현하는 도메인 엔티티입니다.
 */
export class ForbiddenWord {
    private constructor(
        public readonly id: bigint,
        public readonly word: string,
        public readonly description: string | null,
        public readonly isActive: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    /**
     * DB에서 조회한 데이터로부터 엔티티 생성
     */
    static fromPersistence(data: {
        id: bigint;
        word: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): ForbiddenWord {
        return new ForbiddenWord(
            data.id,
            data.word,
            data.description,
            data.isActive,
            data.createdAt,
            data.updatedAt,
        );
    }

    /**
     * 신규 금지어 생성을 위한 팩토리 메서드
     */
    static create(props: {
        word: string;
        description?: string;
    }): ForbiddenWord {
        return new ForbiddenWord(
            0n, // 실제 저장 시 생성됨
            props.word.toLowerCase().trim(),
            props.description || null,
            true,
            new Date(),
            new Date(),
        );
    }
}
