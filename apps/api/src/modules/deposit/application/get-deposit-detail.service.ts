// src/modules/deposit/application/get-deposit-detail.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type {
  DepositDetailRepositoryPort,
  DepositWithUser,
} from '../ports/out/deposit-detail.repository.port';

interface GetDepositDetailParams {
  id: bigint;
}

@Injectable()
export class GetDepositDetailService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
  ) {}

  async execute(params: GetDepositDetailParams): Promise<DepositWithUser> {
    const { id } = params;
    return await this.depositRepository.getByIdWithUser(id);
  }
}
