// src/modules/deposit/application/create-crypto-config.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { CRYPTO_CONFIG_REPOSITORY } from '../ports/out';
import type { CryptoConfigRepositoryPort } from '../ports/out';
import { CryptoConfig } from '../domain';
import { generateUid } from 'src/utils/id.util';

interface CreateCryptoConfigParams {
    symbol: string;
    network: string;
    isActive?: boolean;
    minDepositAmount: string;
    depositFeeRate: string;
    confirmations: number;
    contractAddress?: string;
}

@Injectable()
export class CreateCryptoConfigService {
    constructor(
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly repository: CryptoConfigRepositoryPort,
    ) { }

    async execute({
        symbol,
        network,
        isActive,
        minDepositAmount,
        depositFeeRate,
        confirmations,
        contractAddress,
    }: CreateCryptoConfigParams): Promise<CryptoConfig> {
        const config = CryptoConfig.create({
            uid: generateUid(),
            symbol,
            network,
            isActive,
            minDepositAmount: new Prisma.Decimal(minDepositAmount),
            depositFeeRate: new Prisma.Decimal(depositFeeRate),
            confirmations,
            contractAddress,
        });

        return await this.repository.create(config);
    }
}
