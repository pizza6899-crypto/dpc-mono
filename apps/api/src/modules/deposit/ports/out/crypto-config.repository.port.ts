// src/modules/deposit/ports/out/crypto-config.repository.port.ts
import { CryptoConfig } from '../../domain';

export interface CryptoConfigRepositoryPort {
    listActive(): Promise<CryptoConfig[]>;
    findByUid(uid: string): Promise<CryptoConfig | null>;
    getByUid(uid: string): Promise<CryptoConfig>;
    findById(id: bigint): Promise<CryptoConfig | null>;
    getById(id: bigint): Promise<CryptoConfig>;
    findBySymbolAndNetwork(symbol: string, network: string): Promise<CryptoConfig | null>;
    getBySymbolAndNetwork(symbol: string, network: string): Promise<CryptoConfig>;
}
