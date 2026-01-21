import { Module } from '@nestjs/common';
import { WalletQueryService } from './application/wallet-query.service';
import { GetWalletTransactionHistoryService } from './application/get-wallet-transaction-history.service';
import { UserWalletRepository } from './infrastructure/user-wallet.repository';
import { UserWalletMapper } from './infrastructure/user-wallet.mapper';
import { WalletTransactionMapper } from './infrastructure/wallet-transaction.mapper';
import { USER_WALLET_REPOSITORY } from './ports/out/user-wallet.repository.token';
import { WalletController } from './controllers/user/wallet.controller';
import { WalletAdminController } from './controllers/admin/wallet-admin.controller';
import { UserModule } from '../user/user.module';
import { WALLET_TRANSACTION_REPOSITORY } from './ports/out/wallet-transaction.repository.token';
import { WalletTransactionRepository } from './infrastructure/wallet-transaction.repository';
import { UserBalanceService } from './application/user-balance.service';
import { UserWalletPolicy } from './domain';
import { SqidsModule } from 'src/common/sqids/sqids.module';

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
  imports: [UserModule, SqidsModule],
  providers: [
    {
      provide: USER_WALLET_REPOSITORY,
      useClass: UserWalletRepository,
    },
    {
      provide: WALLET_TRANSACTION_REPOSITORY,
      useClass: WalletTransactionRepository,
    },
    WalletQueryService,
    UserBalanceService,
    UserWalletPolicy,
    GetWalletTransactionHistoryService,
    UserWalletMapper,
    WalletTransactionMapper,
  ],
  controllers: [WalletController, WalletAdminController],
  exports: [
    UserBalanceService,
    GetWalletTransactionHistoryService,
    WalletQueryService,
  ],
})
export class WalletModule { }
