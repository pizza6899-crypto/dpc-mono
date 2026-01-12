// src/modules/deposit/application/get-deposits.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { PaginatedData } from 'src/common/http/types';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort, DepositListQuery, DepositWithUser } from '../ports/out/deposit-detail.repository.port';

interface GetDepositsParams {
  query: DepositListQuery;
}

@Injectable()
export class GetDepositsService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
  ) { }

  async execute(params: GetDepositsParams): Promise<PaginatedData<DepositWithUser>> {
    const { query } = params;
    const { skip = 0, take = 20 } = query;

    const { items, total } = await this.depositRepository.list(query);

    return {
      data: items,
      page: Math.floor(skip / take) + 1,
      limit: take,
      total,
    };
  }
}
