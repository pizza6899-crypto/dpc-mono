// src/modules/deposit/application/find-crypto-configs-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { CRYPTO_CONFIG_REPOSITORY } from '../ports/out';
import type { CryptoConfigRepositoryPort } from '../ports/out';
import { CryptoConfig } from '../domain';
import type { PaginatedData } from 'src/common/http/types';

interface FindCryptoConfigsAdminParams {
    page?: number;
    limit?: number;
    symbol?: string;
    network?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class FindCryptoConfigsAdminService {
    constructor(
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly repository: CryptoConfigRepositoryPort,
    ) { }

    async execute({
        page = 1,
        limit = 20,
        symbol,
        network,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    }: FindCryptoConfigsAdminParams): Promise<PaginatedData<CryptoConfig>> {
        const skip = (page - 1) * limit;

        const [configs, total] = await Promise.all([
            this.repository.list({
                skip,
                take: limit,
                symbol,
                network,
                isActive,
                sortBy,
                sortOrder,
            }),
            this.repository.count({
                symbol,
                network,
                isActive,
            }),
        ]);

        return {
            data: configs,
            page,
            limit,
            total,
        };
    }
}
