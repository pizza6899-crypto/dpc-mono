// src/modules/deposit/application/get-crypto-config-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { CRYPTO_CONFIG_REPOSITORY } from '../ports/out';
import type { CryptoConfigRepositoryPort } from '../ports/out';
import { CryptoConfig } from '../domain';

interface GetCryptoConfigAdminParams {
    id: bigint;
}

@Injectable()
export class GetCryptoConfigAdminService {
    constructor(
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly repository: CryptoConfigRepositoryPort,
    ) { }

    async execute({ id }: GetCryptoConfigAdminParams): Promise<CryptoConfig> {
        return await this.repository.getById(id);
    }
}
