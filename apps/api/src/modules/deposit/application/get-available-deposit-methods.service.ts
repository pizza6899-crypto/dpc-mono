// src/modules/deposit/application/get-available-deposit-methods.service.ts
import { Inject, Injectable } from '@nestjs/common';
import {
    BANK_CONFIG_REPOSITORY,
    CRYPTO_CONFIG_REPOSITORY,
} from '../ports/out';
import type {
    BankConfigRepositoryPort,
    CryptoConfigRepositoryPort,
} from '../ports/out';
import { BankConfig, CryptoConfig } from '../domain';
import { GetAvailableDepositMethodsResponseDto } from '../dtos/deposit-method-user.dto';
import { ExchangeCurrencyCode } from '@repo/database';

@Injectable()
export class GetAvailableDepositMethodsService {
    constructor(
        @Inject(BANK_CONFIG_REPOSITORY)
        private readonly bankConfigRepository: BankConfigRepositoryPort,
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly cryptoConfigRepository: CryptoConfigRepositoryPort,
    ) { }

    async execute(): Promise<GetAvailableDepositMethodsResponseDto> {
        const [bankConfigs, cryptoConfigs] = await Promise.all([
            this.bankConfigRepository.listActive(),
            this.cryptoConfigRepository.listActive(),
        ]);

        return {
            bankTransfer: bankConfigs.map((config: BankConfig) => ({
                uid: config.uid!,
                bankName: config.bankName,
                accountHolder: config.accountHolder,
                accountNumber: config.accountNumber,
                currency: config.currency as ExchangeCurrencyCode,
                minAmount: config.minAmount.toString(),
                maxAmount: config.maxAmount?.toString() ?? null,
                description: config.description,
                notes: config.notes,
            })),
            crypto: cryptoConfigs.map((config: CryptoConfig) => ({
                uid: config.uid,
                symbol: config.symbol as ExchangeCurrencyCode,
                network: config.network,
                minDepositAmount: config.minDepositAmount.toString(),
                depositFeeRate: config.depositFeeRate.toString(),
                confirmations: config.confirmations,
                contractAddress: config.contractAddress,
            })),
        };
    }
}
