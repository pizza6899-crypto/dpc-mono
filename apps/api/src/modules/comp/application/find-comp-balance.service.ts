import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompWallet } from '../domain';

@Injectable()
export class FindCompBalanceService {
    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
    ) { }

    async execute(userId: bigint, currency: ExchangeCurrencyCode): Promise<CompWallet> {
        const wallet = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        if (!wallet) {
            // Return empty wallet object for consistent UI handling
            return CompWallet.create({ userId, currency });
        }
        return wallet;
    }
}
