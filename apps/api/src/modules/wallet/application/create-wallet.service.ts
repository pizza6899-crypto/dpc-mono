import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { UserWallet } from '../domain';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';

@Injectable()
export class CreateWalletService {
    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly walletRepository: UserWalletRepositoryPort,
    ) { }

    async execute(params: { userId: bigint; currency: ExchangeCurrencyCode }): Promise<UserWallet> {
        const { userId, currency } = params;
        return this.walletRepository.upsert(
            UserWallet.create({
                userId,
                currency,
            }),
        );
    }
}
