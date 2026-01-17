// src/modules/deposit/application/update-crypto-config-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma';
import { CRYPTO_CONFIG_REPOSITORY } from '../ports/out';
import type { CryptoConfigRepositoryPort } from '../ports/out';
import { CryptoConfig } from '../domain';

interface UpdateCryptoConfigAdminParams {
    id: bigint;
    symbol?: string;
    network?: string;
    isActive?: boolean;
    minDepositAmount?: string;
    depositFeeRate?: string;
    confirmations?: number;
    contractAddress?: string;
}

@Injectable()
export class UpdateCryptoConfigAdminService {
    constructor(
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly repository: CryptoConfigRepositoryPort,
    ) { }

    async execute({
        id,
        symbol,
        network,
        isActive,
        minDepositAmount,
        depositFeeRate,
        confirmations,
        contractAddress,
    }: UpdateCryptoConfigAdminParams): Promise<CryptoConfig> {
        const config = await this.repository.getById(id);

        const updatedConfig = config.update({
            symbol,
            network,
            isActive,
            minDepositAmount: minDepositAmount ? new Prisma.Decimal(minDepositAmount) : undefined,
            depositFeeRate: depositFeeRate ? new Prisma.Decimal(depositFeeRate) : undefined,
            confirmations,
            contractAddress: contractAddress !== undefined ? contractAddress : undefined,
        });

        return await this.repository.update(updatedConfig);
    }
}
