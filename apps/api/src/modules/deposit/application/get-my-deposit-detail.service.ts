import { Injectable, Inject } from '@nestjs/common';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositNotFoundException, DepositDetail } from '../domain';

interface GetMyDepositDetailParams {
  id: bigint;
  userId: bigint;
}

@Injectable()
export class GetMyDepositDetailService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
  ) {}

  async execute(params: GetMyDepositDetailParams): Promise<DepositDetail> {
    const { id, userId } = params;

    const deposit = await this.depositRepository.findByIdAndUserId(id, userId);

    if (!deposit) {
      throw new DepositNotFoundException(id.toString());
    }

    return deposit;
  }
}
