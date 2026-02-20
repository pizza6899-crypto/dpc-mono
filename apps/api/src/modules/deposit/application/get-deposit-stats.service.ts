// src/modules/deposit/application/get-deposit-stats.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type {
  DepositDetailRepositoryPort,
  DepositStats,
} from '../ports/out/deposit-detail.repository.port';

interface GetDepositStatsResult {
  todayTotalAmount: string;
  pendingCount: number;
  methodDistribution: {
    crypto: number;
    bank: number;
  };
}

@Injectable()
export class GetDepositStatsService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
  ) {}

  async execute(): Promise<GetDepositStatsResult> {
    const stats = await this.depositRepository.getStats();

    return {
      todayTotalAmount: stats.todayTotalAmount.toString(),
      pendingCount: stats.pendingCount,
      methodDistribution: stats.methodDistribution,
    };
  }
}
