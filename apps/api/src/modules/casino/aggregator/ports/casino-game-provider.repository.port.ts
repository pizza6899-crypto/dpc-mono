import { CasinoGameProvider } from '../domain';

export type ListProvidersOptions = {
    aggregatorId?: bigint;
};

export interface CasinoGameProviderRepositoryPort {
    /**
     * 생성
     */
    create(provider: CasinoGameProvider): Promise<CasinoGameProvider>;

    /**
     * 수정
     */
    update(provider: CasinoGameProvider): Promise<CasinoGameProvider>;

    /**
     * 단건 조회 (Optional)
     */
    findById(id: bigint): Promise<CasinoGameProvider | null>;

    /**
     * 단건 조회 (Required)
     */
    getById(id: bigint): Promise<CasinoGameProvider>;

    /**
     * 코드로 조회 (Optional) - 어그리게이터 ID와 함께 조회해야 유니크함
     */
    findByCode(aggregatorId: bigint, code: string): Promise<CasinoGameProvider | null>;

    /**
     * 목록 조회
     */
    list(options?: ListProvidersOptions): Promise<CasinoGameProvider[]>;
}
