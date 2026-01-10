import { Inject, Injectable } from '@nestjs/common';
import { CryptoWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

@Injectable()
export class ToggleCryptoConfigActiveService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(id: bigint): Promise<CryptoWithdrawConfig> {
        const config = await this.repository.getCryptoConfigById(id);
        config.toggleActive();
        return await this.repository.saveCryptoConfig(config);
    }
}
