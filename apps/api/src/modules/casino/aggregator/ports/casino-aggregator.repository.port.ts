import { CasinoAggregator } from '../domain';

export interface CasinoAggregatorRepositoryPort {
    // 조회
    findById(id: bigint): Promise<CasinoAggregator | null>;
    getById(id: bigint): Promise<CasinoAggregator>;
    findByCode(code: string): Promise<CasinoAggregator | null>;
    getByCode(code: string): Promise<CasinoAggregator>;
    findAll(): Promise<CasinoAggregator[]>;
    findAllActive(): Promise<CasinoAggregator[]>;

    // 생성/수정
    create(aggregator: CasinoAggregator): Promise<CasinoAggregator>;
    update(aggregator: CasinoAggregator): Promise<CasinoAggregator>;
}
