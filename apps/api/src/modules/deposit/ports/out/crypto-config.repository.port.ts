// src/modules/deposit/ports/out/crypto-config.repository.port.ts
import type { CryptoConfig } from '../../domain';

export interface CryptoConfigRepositoryPort {
  listActive(): Promise<CryptoConfig[]>;
  findByUid(uid: string): Promise<CryptoConfig | null>;
  getByUid(uid: string): Promise<CryptoConfig>;
  findById(id: bigint): Promise<CryptoConfig | null>;
  getById(id: bigint): Promise<CryptoConfig>;
  findBySymbolAndNetwork(
    symbol: string,
    network: string,
  ): Promise<CryptoConfig | null>;
  getBySymbolAndNetwork(symbol: string, network: string): Promise<CryptoConfig>;
  list(params: {
    skip?: number;
    take?: number;
    symbol?: string;
    network?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<CryptoConfig[]>;
  count(params: {
    symbol?: string;
    network?: string;
    isActive?: boolean;
  }): Promise<number>;
  create(config: CryptoConfig): Promise<CryptoConfig>;
  update(config: CryptoConfig): Promise<CryptoConfig>;
  delete(id: bigint): Promise<void>;
}
