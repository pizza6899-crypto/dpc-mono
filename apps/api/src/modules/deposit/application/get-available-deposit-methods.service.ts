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
import { CryptoConfig, BankConfig } from '../domain'; // BankConfig import 추가
import {
    GetAvailableDepositMethodsResponseDto,
    CryptoGroupSimpleDto,
    BankGroupSimpleDto,
} from '../dtos/deposit-method-user.dto';
import { ExchangeCurrencyCode, Prisma } from '@repo/database'; // Prisma util for decimal comparison if needed

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

        // 1. Group Crypto Configs by Symbol
        const cryptoGroupMap = new Map<string, CryptoConfig[]>();
        cryptoConfigs.forEach((config) => {
            const list = cryptoGroupMap.get(config.symbol) || [];
            list.push(config);
            cryptoGroupMap.set(config.symbol, list);
        });

        const cryptoResponse: CryptoGroupSimpleDto[] = Array.from(cryptoGroupMap.entries()).map(([symbol, configs]) => ({
            symbol: symbol as ExchangeCurrencyCode,
            networks: configs.map((config) => ({
                network: config.network,
                minDepositAmount: config.minDepositAmount.toString(),
            })),
        }));

        // 2. Group Bank Configs by Currency and find minimum amount
        const bankGroupMap = new Map<string, BankConfig[]>();
        bankConfigs.forEach((config) => {
            const list = bankGroupMap.get(config.currency) || [];
            list.push(config);
            bankGroupMap.set(config.currency, list);
        });

        const bankResponse: BankGroupSimpleDto[] = Array.from(bankGroupMap.entries()).map(([currency, configs]) => {
            // 해당 통화의 모든 설정 중 가장 작은 최소 입금액 찾기
            let minAmount = configs[0].minAmount;
            for (const config of configs) {
                if (config.minAmount.lessThan(minAmount)) {
                    minAmount = config.minAmount;
                }
            }

            return {
                currency: currency as ExchangeCurrencyCode,
                minAmount: minAmount.toString(),
            };
        });

        return {
            bank: bankResponse,
            crypto: cryptoResponse,
        };
    }
}
