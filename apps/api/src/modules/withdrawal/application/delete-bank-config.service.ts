import { Inject, Injectable } from '@nestjs/common';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

@Injectable()
export class DeleteBankConfigService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(id: bigint): Promise<void> {
        const config = await this.repository.getBankConfigById(id);
        config.delete();
        await this.repository.saveBankConfig(config);
    }
}
