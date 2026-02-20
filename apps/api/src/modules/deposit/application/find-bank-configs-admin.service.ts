// src/modules/deposit/application/find-bank-configs-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { BANK_CONFIG_REPOSITORY } from '../ports/out';
import type { BankConfigRepositoryPort } from '../ports/out';
import { ExchangeCurrencyCode } from '@prisma/client';
import { BankConfig } from '../domain';
import type { PaginatedData } from 'src/common/http/types';

interface FindBankConfigsAdminParams {
  page?: number;
  limit?: number;
  currency?: ExchangeCurrencyCode;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class FindBankConfigsAdminService {
  constructor(
    @Inject(BANK_CONFIG_REPOSITORY)
    private readonly repository: BankConfigRepositoryPort,
  ) {}

  async execute({
    page = 1,
    limit = 20,
    currency,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: FindBankConfigsAdminParams): Promise<PaginatedData<BankConfig>> {
    const skip = (page - 1) * limit;

    const [configs, total] = await Promise.all([
      this.repository.list({
        skip,
        take: limit,
        currency,
        isActive,
        sortBy,
        sortOrder,
      }),
      this.repository.count({
        currency,
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
