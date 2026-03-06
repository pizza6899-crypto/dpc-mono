// src/modules/deposit/application/get-deposits.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { PaginatedData } from 'src/common/http/types';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type {
  DepositDetailRepositoryPort,
  DepositListQuery,
  DepositWithUser,
} from '../ports/out/deposit-detail.repository.port';
import { FindAdminMemoService } from '../../admin-memo/application/find-admin-memo.service';

interface GetDepositsParams {
  query: DepositListQuery;
}

export type DepositWithMemo = DepositWithUser & { memo?: string };

@Injectable()
export class GetDepositsService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly findAdminMemoService: FindAdminMemoService,
  ) { }

  async execute(
    params: GetDepositsParams,
  ): Promise<PaginatedData<DepositWithMemo>> {
    const { query } = params;
    const { skip = 0, take = 20 } = query;

    const { items, total } = await this.depositRepository.list(query);

    if (items.length === 0) {
      return {
        data: [],
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
      };
    }

    // 예치금 ID 추출
    const depositIds = items.map((i) => i.deposit.id!);

    // 배치 조회를 통해 관련된 모든 최신 메모를 Map 형태로 가져옴
    const memoMap = await this.findAdminMemoService.findLatestByTargets('DEPOSIT', depositIds);

    // 각 예치금 항목에 메모 데이터를 병합
    const dataWithMemo: DepositWithMemo[] = items.map((item) => ({
      ...item,
      memo: memoMap.get(item.deposit.id!)?.content,
    }));

    return {
      data: dataWithMemo,
      page: Math.floor(skip / take) + 1,
      limit: take,
      total,
    };
  }
}
