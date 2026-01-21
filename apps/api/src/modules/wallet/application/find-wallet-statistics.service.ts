import { Inject, Injectable } from '@nestjs/common';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';

@Injectable()
export class FindWalletStatisticsService {
    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly repository: UserWalletRepositoryPort,
    ) { }

    async execute(): Promise<any> {
        return await this.repository.getStatistics();
    }
}
