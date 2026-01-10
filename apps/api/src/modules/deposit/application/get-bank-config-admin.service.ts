// src/modules/deposit/application/get-bank-config-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { BANK_CONFIG_REPOSITORY } from '../ports/out';
import type { BankConfigRepositoryPort } from '../ports/out';
import { BankConfig } from '../domain';

interface GetBankConfigAdminParams {
    id: bigint;
}

@Injectable()
export class GetBankConfigAdminService {
    constructor(
        @Inject(BANK_CONFIG_REPOSITORY)
        private readonly repository: BankConfigRepositoryPort,
    ) { }

    async execute({ id }: GetBankConfigAdminParams): Promise<BankConfig> {
        return await this.repository.getById(id);
    }
}
