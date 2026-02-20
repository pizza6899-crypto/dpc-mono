import { Injectable, Inject } from '@nestjs/common';
import { WithdrawalStatus, WithdrawalMethodType } from '@prisma/client';
import { WithdrawalDetail } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface FindWithdrawalsParams {
  userId: bigint;
  status?: WithdrawalStatus;
  methodType?: WithdrawalMethodType;
  limit?: number;
  offset?: number;
}

export interface FindWithdrawalsResult {
  withdrawals: WithdrawalDetail[];
  total: number;
}

@Injectable()
export class FindWithdrawalsService {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly repository: WithdrawalRepositoryPort,
  ) {}

  async execute(params: FindWithdrawalsParams): Promise<FindWithdrawalsResult> {
    const { userId, status, methodType, limit = 20, offset = 0 } = params;

    const [withdrawals, total] = await Promise.all([
      this.repository.findByUserId(userId, {
        status,
        methodType,
        limit,
        offset,
      }),
      this.repository.countByUserId(userId, status),
    ]);

    return { withdrawals, total };
  }
}
