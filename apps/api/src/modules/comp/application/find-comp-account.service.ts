import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompAccount } from '../domain';

@Injectable()
export class FindCompAccountService {
  constructor(
    @Inject(COMP_REPOSITORY)
    private readonly compRepository: CompRepositoryPort,
  ) {}

  async execute(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<CompAccount> {
    const account = await this.compRepository.findByUserIdAndCurrency(
      userId,
      currency,
    );
    if (!account) {
      // Return empty account object for consistent UI handling
      return CompAccount.create({ userId, currency });
    }
    return account;
  }
}
