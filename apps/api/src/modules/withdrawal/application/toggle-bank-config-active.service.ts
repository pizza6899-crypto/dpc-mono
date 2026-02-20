import { Inject, Injectable } from '@nestjs/common';
import { BankWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

@Injectable()
export class ToggleBankConfigActiveService {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly repository: WithdrawalRepositoryPort,
  ) {}

  async execute(id: bigint): Promise<BankWithdrawConfig> {
    const config = await this.repository.getBankConfigById(id);
    config.toggleActive();
    return await this.repository.saveBankConfig(config);
  }
}
