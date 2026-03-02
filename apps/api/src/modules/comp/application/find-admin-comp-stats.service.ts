import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';

interface FindAdminCompStatsParams {
  currency: ExchangeCurrencyCode;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class FindAdminCompStatsService {
  constructor(
    @Inject(COMP_REPOSITORY)
    private readonly compRepository: CompRepositoryPort,
  ) {}

  async execute(params: FindAdminCompStatsParams) {
    const daily = await this.compRepository.getDailyStats(params);

    return daily.map((s) => ({
      date: s.date,
      earned: s.earned.toString(),
      used: s.used.toString(),
    }));
  }
}
