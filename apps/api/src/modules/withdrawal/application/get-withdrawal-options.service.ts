import { Injectable, Inject } from '@nestjs/common';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';
import type { CryptoWithdrawConfig, BankWithdrawConfig } from '../domain';

@Injectable()
export class GetWithdrawalOptionsService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(): Promise<{ crypto: CryptoWithdrawConfig[]; bank: BankWithdrawConfig[] }> {
        const [crypto, bank] = await Promise.all([
            this.repository.findActiveCryptoConfigs(),
            this.repository.findActiveBankConfigs(),
        ]);

        return { crypto, bank };
    }
}


