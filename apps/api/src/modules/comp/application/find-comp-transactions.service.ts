import { Inject, Injectable } from '@nestjs/common';
import { COMP_REPOSITORY } from '../ports';
import type { CompRepositoryPort } from '../ports';
import { ExchangeCurrencyCode } from '@prisma/client';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { CompTransaction } from '../domain';

interface FindCompTransactionsParams {
  userId: bigint;
  currency?: ExchangeCurrencyCode;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

@Injectable()
export class FindCompTransactionsService {
  constructor(
    @Inject(COMP_REPOSITORY)
    private readonly compRepository: CompRepositoryPort,
  ) {}

  async execute(
    params: FindCompTransactionsParams,
  ): Promise<PaginatedData<CompTransaction>> {
    const { userId, currency, startDate, endDate, page, limit } = params;
    const { data, total } = await this.compRepository.findTransactions({
      userId,
      currency,
      startDate,
      endDate,
      page,
      limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
