import { ExchangeCurrencyCode, WithdrawalStatus, WithdrawalMethodType } from '@repo/database';
import { WithdrawalDetail, CryptoWithdrawConfig, BankWithdrawConfig } from '../domain';

export interface WithdrawalRepositoryPort {
    // WithdrawalDetail CRUD
    create(withdrawal: WithdrawalDetail): Promise<WithdrawalDetail>;
    save(withdrawal: WithdrawalDetail): Promise<WithdrawalDetail>;
    findById(id: bigint): Promise<WithdrawalDetail | null>;
    getById(id: bigint): Promise<WithdrawalDetail>;

    // 조회
    findByUserId(
        userId: bigint,
        options?: {
            status?: WithdrawalStatus;
            methodType?: WithdrawalMethodType;
            limit?: number;
            offset?: number;
        },
    ): Promise<WithdrawalDetail[]>;

    findByStatus(
        status: WithdrawalStatus,
        options?: {
            limit?: number;
            offset?: number;
        },
    ): Promise<WithdrawalDetail[]>;

    countByUserId(userId: bigint, status?: WithdrawalStatus): Promise<number>;

    // CryptoWithdrawConfig
    findCryptoConfigBySymbolAndNetwork(
        symbol: string,
        network: string,
    ): Promise<CryptoWithdrawConfig | null>;
    getCryptoConfigBySymbolAndNetwork(
        symbol: string,
        network: string,
    ): Promise<CryptoWithdrawConfig>;
    findCryptoConfigById(id: bigint): Promise<CryptoWithdrawConfig | null>;
    findActiveCryptoConfigs(): Promise<CryptoWithdrawConfig[]>;

    // BankWithdrawConfig
    findBankConfigById(id: bigint): Promise<BankWithdrawConfig | null>;
    getBankConfigById(id: bigint): Promise<BankWithdrawConfig>;
    findBankConfigsByCurrency(currency: ExchangeCurrencyCode): Promise<BankWithdrawConfig[]>;
    findActiveBankConfigs(): Promise<BankWithdrawConfig[]>;
}
