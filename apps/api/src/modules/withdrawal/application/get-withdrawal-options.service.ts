import { Injectable, Inject } from '@nestjs/common';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';
import type { CryptoWithdrawConfig, BankWithdrawConfig } from '../domain';

export interface WithdrawalOptionsResult {
    crypto: CryptoOptionItem[];
    bank: BankOptionItem[];
}

export interface CryptoOptionItem {
    id: string;
    symbol: string;
    network: string;
    minAmount: string;
    maxAmount: string | null;
    feeFixed: string;
    feeRate: string;
}

export interface BankOptionItem {
    id: string;
    currency: string;
    bankName: string;
    minAmount: string;
    maxAmount: string | null;
    feeFixed: string;
    feeRate: string;
}

@Injectable()
export class GetWithdrawalOptionsService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(): Promise<WithdrawalOptionsResult> {
        const [cryptoConfigs, bankConfigs] = await Promise.all([
            this.repository.findActiveCryptoConfigs(),
            this.repository.findActiveBankConfigs(),
        ]);

        return {
            crypto: cryptoConfigs.map(this.toCryptoOptionItem),
            bank: bankConfigs.map(this.toBankOptionItem),
        };
    }

    private toCryptoOptionItem(config: CryptoWithdrawConfig): CryptoOptionItem {
        return {
            id: config.id.toString(),
            symbol: config.symbol,
            network: config.network,
            minAmount: config.minWithdrawAmount.toString(),
            maxAmount: config.maxWithdrawAmount?.toString() ?? null,
            feeFixed: config.props.withdrawFeeFixed.toString(),
            feeRate: config.props.withdrawFeeRate.toString(),
        };
    }

    private toBankOptionItem(config: BankWithdrawConfig): BankOptionItem {
        return {
            id: config.id.toString(),
            currency: config.currency,
            bankName: config.bankName,
            minAmount: config.minWithdrawAmount.toString(),
            maxAmount: config.maxWithdrawAmount?.toString() ?? null,
            feeFixed: config.props.withdrawFeeFixed.toString(),
            feeRate: config.props.withdrawFeeRate.toString(),
        };
    }
}

