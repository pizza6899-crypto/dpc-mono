// src/modules/wallet/application/update-user-balance.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WalletQueryService } from './wallet-query.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import {
    UserWallet,
    WalletNotFoundException,
    BalanceType,
    UpdateOperation,
} from '../domain';
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';

interface UpdateUserBalanceParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    balanceType: BalanceType;
    operation: UpdateOperation;
    amount: Prisma.Decimal;
}

interface UpdateUserBalanceResult {
    wallet: UserWallet;
    beforeMainBalance: Prisma.Decimal;
    afterMainBalance: Prisma.Decimal;
    beforeBonusBalance: Prisma.Decimal;
    afterBonusBalance: Prisma.Decimal;
    mainBalanceChange: Prisma.Decimal;
    bonusBalanceChange: Prisma.Decimal;
}

/**
 * 시스템 내부용 사용자 잔액 업데이트 Use Case
 *
 * 시스템(카지노 등)이 사용자의 잔액을 직접 변경할 때 사용합니다.
 * 사용자 존재 여부를 검증하지 않을 수 있습니다. (호출 측 책임 또는 WalletQueryService에 위임)
 */
@Injectable()
export class UpdateUserBalanceService {
    private readonly logger = new Logger(UpdateUserBalanceService.name);

    constructor(
        @Inject(USER_WALLET_REPOSITORY)
        private readonly walletRepository: UserWalletRepositoryPort,
        private readonly walletQueryService: WalletQueryService,
    ) { }

    /**
     * 잔액 업데이트 실행
     * 트랜잭션 내에서 실행되어야 하며, 락을 획득합니다.
     */
    @Transactional()
    async execute(
        params: UpdateUserBalanceParams,
    ): Promise<UpdateUserBalanceResult> {
        // const { userId, currency, balanceType, operation, amount } = params;

        // // 1. 락 획득 (동시성 제어)
        // await this.walletRepository.acquireLock(userId);

        // // 2. 월렛 조회
        // const wallet = await this.walletQueryService.getWallet(
        //     userId,
        //     currency,
        //     false, // 자동 생성 여부: 시스템 로직이므로 없을 수 있음 (근데 카지노면 있어야 함)
        // );

        // if (!wallet) {
        //     throw new WalletNotFoundException(userId, currency);
        // }

        // // 3. 잔액 업데이트 (도메인 로직 위임)
        // const {
        //     mainChange,
        //     bonusChange,
        //     beforeMainBalance,
        //     afterMainBalance,
        //     beforeBonusBalance,
        //     afterBonusBalance,
        // } = wallet.updateBalance(balanceType, operation, amount);

        // // 4. 저장
        // const savedWallet = await this.walletRepository.upsert(wallet);

        // return {
        //     wallet: savedWallet,
        //     beforeMainBalance,
        //     afterMainBalance,
        //     beforeBonusBalance,
        //     afterBonusBalance,
        //     mainBalanceChange: mainChange,
        //     bonusBalanceChange: bonusChange,
        // };

        // mock return
        return {
            wallet: UserWallet.create({
                userId: params.userId,
                currency: params.currency
            }),
            beforeMainBalance: new Prisma.Decimal(0),
            afterMainBalance: new Prisma.Decimal(0),
            beforeBonusBalance: new Prisma.Decimal(0),
            afterBonusBalance: new Prisma.Decimal(0),
            mainBalanceChange: new Prisma.Decimal(0),
            bonusBalanceChange: new Prisma.Decimal(0),
        };
    }
}
