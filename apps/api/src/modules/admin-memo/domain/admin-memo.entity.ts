import { AdminMemoContentEmptyException } from './admin-memo.exception';

/**
 * AdminMemo 도메인 엔티티
 * 
 * 관리자가 특정 도메인(예: 입금)에 대해 작성한 메모를 표현합니다.
 * 이 엔티티는 Audit Log 성격으로, 수정 및 삭제가 불가능한 Append-only 구조를 지향합니다.
 */
export class AdminMemo {
    private constructor(
        private readonly _id: bigint,
        private readonly _adminId: bigint,
        private readonly _content: string,
        private readonly _createdAt: Date,
        private readonly _depositId: bigint | null,
        // UI 편의를 위해 작성자 닉네임을 포함할 수 있음 (Entity Enrichment)
        private readonly _adminNickname?: string,
    ) { }

    /**
     * 새로운 메모 엔티티 생성
     */
    static create(params: {
        adminId: bigint;
        content: string;
        depositId?: bigint;
    }): AdminMemo {
        const trimmedContent = params.content?.trim();

        if (!trimmedContent) {
            throw new AdminMemoContentEmptyException();
        }

        return new AdminMemo(
            0n, // 아직 저장되지 않은 상태
            params.adminId,
            trimmedContent,
            new Date(),
            params.depositId ?? null,
        );
    }

    /**
     * 영속성 계층에서 복원
     */
    static fromPersistence(data: {
        id: bigint;
        adminId: bigint;
        content: string;
        createdAt: Date;
        depositId?: bigint | null;
        adminNickname?: string;
    }): AdminMemo {
        return new AdminMemo(
            data.id,
            data.adminId,
            data.content,
            data.createdAt,
            data.depositId ?? null,
            data.adminNickname,
        );
    }

    // --- Getters ---

    get id(): bigint { return this._id; }
    get adminId(): bigint { return this._adminId; }
    get content(): string { return this._content; }
    get createdAt(): Date { return this._createdAt; }
    get depositId(): bigint | null { return this._depositId; }
    get adminNickname(): string | undefined { return this._adminNickname; }
}
