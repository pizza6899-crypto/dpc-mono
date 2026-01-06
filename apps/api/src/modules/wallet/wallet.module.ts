// src/modules/wallet/wallet.module.ts
import { Module } from '@nestjs/common';
import { CreateWalletService } from './application/create-wallet.service';
import { WalletQueryService } from './application/wallet-query.service';
import { GetUserBalanceService } from './application/get-user-balance.service';
import { GetUserBalanceAdminService } from './application/get-user-balance-admin.service';
import { UpdateUserBalanceAdminService } from './application/update-user-balance-admin.service';
import { GetWalletTransactionHistoryAdminService } from './application/get-wallet-transaction-history-admin.service';
import { UserWalletRepository } from './infrastructure/user-wallet.repository';
import { UserWalletMapper } from './infrastructure/user-wallet.mapper';
import { USER_WALLET_REPOSITORY } from './ports/out/user-wallet.repository.token';
import { WalletController } from './controllers/user/wallet.controller';
import { WalletAdminController } from './controllers/admin/wallet-admin.controller';
import { UserModule } from '../user/user.module';
import { WALLET_TRANSACTION_REPOSITORY } from './ports/out/wallet-transaction.repository.token';
import { WalletTransactionRepository } from './infrastructure/wallet-transaction.repository';
/**
 * Wallet 모듈
 *
 * 사용자 잔액(UserBalance) 관리 전담 모듈
 *
 * ## 책임 범위
 * - UserBalance CRUD (생성, 조회, 업데이트)
 * - 잔액 조회 (mainBalance, bonusBalance)
 * - 잔액 업데이트 (증가/감소)
 * - 잔액 검증 (잔액 부족 체크 등)
 * - 잔액 이력 관리 (선택적)
 *
 * ## 제외 범위
 * - 입출금 처리 → PaymentModule
 * - 잔액 통계 → UserStatsModule
 * - 카지노 게임 잔액 로직 → CasinoModule (casino-balance.service.ts)
 * - 어필리에이트 지갑 → AffiliateCommissionModule (AffiliateWallet)
 *
 * ## 사용 모델
 * - UserBalance (mainBalance, bonusBalance)
 * - UserBalanceStats (통계는 UserStatsModule에서 관리)
 */
@Module({
  imports: [UserModule],
  providers: [
    CreateWalletService,
    GetUserBalanceService,
    GetUserBalanceAdminService,
    UpdateUserBalanceAdminService,
    GetWalletTransactionHistoryAdminService,
    UserWalletMapper,
    {
      provide: USER_WALLET_REPOSITORY,
      useClass: UserWalletRepository,
    },
    {
      provide: WALLET_TRANSACTION_REPOSITORY,
      useClass: WalletTransactionRepository,
    },
    WalletQueryService,
  ],
  controllers: [WalletController, WalletAdminController],
  exports: [
    CreateWalletService,
    GetUserBalanceService,
    GetUserBalanceAdminService,
    UpdateUserBalanceAdminService,
    GetWalletTransactionHistoryAdminService,
    WalletQueryService,
  ],
})
export class WalletModule { }
