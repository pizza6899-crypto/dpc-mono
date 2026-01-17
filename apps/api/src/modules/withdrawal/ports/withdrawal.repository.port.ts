import { ExchangeCurrencyCode, WithdrawalStatus, WithdrawalMethodType } from 'src/generated/prisma';
import { WithdrawalDetail, CryptoWithdrawConfig, BankWithdrawConfig } from '../domain';

export interface WithdrawalRepositoryPort {
    // 동시성 제어
    acquireUserLock(userId: bigint): Promise<void>;

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

    /**
     * 유저가 진행 중인 출금 요청이 있는지 확인
     * PENDING, PENDING_REVIEW, PROCESSING, SENDING 상태를 확인
     */
    hasPendingWithdrawal(userId: bigint): Promise<boolean>;

    // CryptoWithdrawConfig
    findCryptoConfigBySymbolAndNetwork(
        symbol: string,
        network: string,
        includeDeleted?: boolean,
    ): Promise<CryptoWithdrawConfig | null>;
    getCryptoConfigBySymbolAndNetwork(
        symbol: string,
        network: string,
    ): Promise<CryptoWithdrawConfig>;
    findCryptoConfigById(id: bigint): Promise<CryptoWithdrawConfig | null>;
    getCryptoConfigById(id: bigint): Promise<CryptoWithdrawConfig>;
    findActiveCryptoConfigs(): Promise<CryptoWithdrawConfig[]>;
    // Admin용 메서드
    findCryptoConfigs(options?: {
        page?: number;
        limit?: number;
        symbol?: string;
        network?: string;
        isActive?: boolean;
    }): Promise<{ configs: CryptoWithdrawConfig[]; total: number }>;
    saveCryptoConfig(config: CryptoWithdrawConfig): Promise<CryptoWithdrawConfig>;

    // BankWithdrawConfig
    findBankConfigById(id: bigint): Promise<BankWithdrawConfig | null>;
    getBankConfigById(id: bigint): Promise<BankWithdrawConfig>;
    findBankConfigByCurrencyAndName(
        currency: ExchangeCurrencyCode,
        bankName: string,
        includeDeleted?: boolean,
    ): Promise<BankWithdrawConfig | null>;
    findBankConfigsByCurrency(currency: ExchangeCurrencyCode): Promise<BankWithdrawConfig[]>;
    findActiveBankConfigs(): Promise<BankWithdrawConfig[]>;
    // Admin용 메서드
    findBankConfigs(options?: {
        page?: number;
        limit?: number;
        bankName?: string;
        currency?: ExchangeCurrencyCode;
        isActive?: boolean;
    }): Promise<{ configs: BankWithdrawConfig[]; total: number }>;
    saveBankConfig(config: BankWithdrawConfig): Promise<BankWithdrawConfig>;
}
