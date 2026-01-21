import { Inject, Injectable } from '@nestjs/common';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { UserWallet } from '../domain';
import { UserWalletSearchOptions } from '../ports/out/user-wallet.search-options';

export interface FindUserWalletsResult {
    items: UserWallet[];
    total: number;
}

@Injectable()
export class FindUserWalletsService {
    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly repository: UserWalletRepositoryPort,
    ) { }

    async execute(options: UserWalletSearchOptions): Promise<FindUserWalletsResult> {
        const [items, total] = await this.repository.list(options);
        return { items, total };
    }
}
