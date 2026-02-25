import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports';
import type { CompRepositoryPort } from '../ports';
import { FindCompAccountService } from './find-comp-account.service';
import { CompAccount } from '../domain';

@Injectable()
export class UpdateCompAccountStatusService {
    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
        private readonly findCompAccountService: FindCompAccountService,
    ) { }

    async execute(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        isFrozen: boolean;
    }): Promise<CompAccount> {
        let account = await this.findCompAccountService.execute(
            params.userId,
            params.currency,
        );

        if (account.id === BigInt(0)) {
            // If it doesn't exist, we save it first
            account = await this.compRepository.save(account);
        }

        const updatedAccount = account.updateStatus(params.isFrozen);
        return await this.compRepository.save(updatedAccount);
    }
}
