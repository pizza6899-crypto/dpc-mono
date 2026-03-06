// src/modules/deposit/application/get-deposit-detail.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type {
  DepositDetailRepositoryPort,
  DepositWithUser,
} from '../ports/out/deposit-detail.repository.port';
import { FindAdminMemoService } from '../../admin-memo/application/find-admin-memo.service';

interface GetDepositDetailParams {
  id: bigint;
}

export type DepositWithMemo = DepositWithUser & { memo?: string };

@Injectable()
export class GetDepositDetailService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly findAdminMemoService: FindAdminMemoService,
  ) { }

  async execute(params: GetDepositDetailParams): Promise<DepositWithMemo> {
    const { id } = params;

    // 1. 단건 예치금 데이터 조회
    const depositWithUser = await this.depositRepository.getByIdWithUser(id);

    // 2. 관리자 메모 조회 (배치 메서드 재활용)
    const memoMap = await this.findAdminMemoService.findLatestByTargets('DEPOSIT', [id]);

    // 3. 병합하여 반환
    return {
      ...depositWithUser,
      memo: memoMap.get(id)?.content,
    };
  }
}
