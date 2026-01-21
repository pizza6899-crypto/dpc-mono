import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { UserWallet } from '../domain';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

/**
 * 사용자 지갑 초기화 서비스 (System Use Case)
 * 
 * 신규 사용자 가입 시 시스템에 정의된 모든 통화의 지갑을 생성합니다.
 */
@Injectable()
export class InitializeUserWalletsService {
    private readonly logger = new Logger(InitializeUserWalletsService.name);

    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly walletRepository: UserWalletRepositoryPort,
    ) { }

    @Transactional()
    async execute(userId: bigint): Promise<UserWallet[]> {
        // 현재 보유 중인 지갑 조회
        const existingWallets = await this.walletRepository.findByUserId(userId);
        const existingCurrencies = new Set(existingWallets.map(w => w.currency));

        // 미생성 통화 확인
        const missingCurrencies = WALLET_CURRENCIES.filter(
            currency => !existingCurrencies.has(currency)
        );

        if (missingCurrencies.length === 0) {
            return existingWallets;
        }

        // 누락된 지갑 생성
        const createdWallets = await Promise.all(
            missingCurrencies.map(currency => {
                const wallet = UserWallet.create({ userId, currency });
                return this.walletRepository.create(wallet);
            })
        );

        this.logger.log(`Created ${createdWallets.length} wallets for user: ${userId}`);

        return [...existingWallets, ...createdWallets];
    }
}
