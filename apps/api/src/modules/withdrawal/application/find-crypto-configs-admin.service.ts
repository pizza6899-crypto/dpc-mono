import { Inject, Injectable } from '@nestjs/common';
import { CryptoWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

export interface FindCryptoConfigsAdminParams {
  page?: number;
  limit?: number;
  symbol?: string;
  network?: string;
  isActive?: boolean;
}

@Injectable()
export class FindCryptoConfigsAdminService {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly repository: WithdrawalRepositoryPort,
  ) {}

  async execute(
    params: FindCryptoConfigsAdminParams,
  ): Promise<{ configs: CryptoWithdrawConfig[]; total: number }> {
    return await this.repository.findCryptoConfigs(params);
  }
}
