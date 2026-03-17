// src/modules/deposit/application/get-my-deposits.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { PaginatedData } from 'src/common/http/types';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports';
import type {
  DepositDetailRepositoryPort,
  DepositListQuery,
} from '../ports/deposit-detail.repository.port';
import { DepositDetail } from '../domain';

interface GetMyDepositsParams {
  query: DepositListQuery;
  userId: bigint;
}

@Injectable()
export class GetMyDepositsService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
  ) {}

  async execute(
    params: GetMyDepositsParams,
  ): Promise<PaginatedData<DepositDetail>> {
    const { query, userId } = params;
    const page = query.skip
      ? Math.floor(query.skip / (query.take || 20)) + 1
      : 1;
    const limit = query.take || 20;

    const { items, total } = await this.depositRepository.listByUserId(
      userId,
      query,
    );

    return {
      data: items,
      page,
      limit,
      total,
    };
  }
}
