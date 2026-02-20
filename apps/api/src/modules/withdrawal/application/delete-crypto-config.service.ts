import { Inject, Injectable } from '@nestjs/common';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

@Injectable()
export class DeleteCryptoConfigService {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly repository: WithdrawalRepositoryPort,
  ) {}

  async execute(id: bigint): Promise<void> {
    const config = await this.repository.getCryptoConfigById(id);
    config.delete();
    await this.repository.saveCryptoConfig(config);
  }
}
