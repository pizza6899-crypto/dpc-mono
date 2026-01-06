// src/modules/wallet/application/update-user-balance-admin.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WalletQueryService } from './wallet-query.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import {
  UserWallet,
  WalletTransaction,
  WalletNotFoundException,
  BalanceType,
  UpdateOperation,
} from '../domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import type { ExchangeCurrencyCode } from '@repo/database';
import { Prisma, TransactionType, TransactionStatus, AdjustmentReasonCode } from '@repo/database';
import { Transactional } from '@nestjs-cls/transactional';

interface UpdateUserBalanceAdminParams {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  balanceType: BalanceType;
  operation: UpdateOperation;
  amount: Prisma.Decimal;
  adminUserId: bigint;
  reasonCode: AdjustmentReasonCode;
  internalNote?: string;
}

interface UpdateUserBalanceAdminResult {
  wallet: UserWallet;
  beforeMainBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
  mainBalanceChange: Prisma.Decimal;
  bonusBalanceChange: Prisma.Decimal;
}

/**
 * 관리자용 사용자 잔액 업데이트 Use Case
 *
 * 관리자가 특정 사용자의 잔액을 증가 또는 감소시킵니다.
 * 사용자 존재 여부를 검증한 후 잔액을 업데이트합니다.
 * - 메인 잔액만 업데이트
 * - 보너스 잔액만 업데이트
 * - 총 잔액에서 차감 (메인 우선, 부족하면 보너스에서 차감)
 */
@Injectable()
export class UpdateUserBalanceAdminService {
  private readonly logger = new Logger(UpdateUserBalanceAdminService.name);

  constructor(
    @Inject(USER_WALLET_REPOSITORY)
    private readonly walletRepository: UserWalletRepositoryPort,
    private readonly walletQueryService: WalletQueryService,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: WalletTransactionRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) { }

  @Transactional()
  async execute(
    params: UpdateUserBalanceAdminParams,
  ): Promise<UpdateUserBalanceAdminResult> {
    const { userId, currency, balanceType, operation, amount, adminUserId, reasonCode, internalNote } = params;

    // 1. 사용자 존재 여부 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. 락 획득 (동시성 제어 - Advisory Lock)
    await this.walletRepository.acquireLock(userId);

    // 3. 월렛 조회 (자동 생성 안함)
    const wallet = await this.walletQueryService.getWallet(
      userId,
      currency,
      false,
    );

    if (!wallet) {
      // 관리자가 수정하려는데 지갑이 없다면 에러 발생 (생성 로직 제거됨)
      throw new WalletNotFoundException(userId, currency);
    }

    // 5. 잔액 업데이트
    const {
      mainChange,
      bonusChange,
      beforeMainBalance,
      afterMainBalance,
      beforeBonusBalance,
      afterBonusBalance,
    } = wallet.updateBalance(balanceType, operation, amount);

    // 6. 저장
    const savedWallet = await this.walletRepository.upsert(wallet);

    // 7. 변경량 및 Total 계산
    const totalChange = mainChange.add(bonusChange);
    const beforeTotalAmount = beforeMainBalance.add(beforeBonusBalance);
    const afterTotalAmount = afterMainBalance.add(afterBonusBalance);

    const transaction = WalletTransaction.create({
      userId,
      type: TransactionType.ADMIN_ADJUST,
      status: TransactionStatus.COMPLETED,
      currency,
      amount: totalChange, // 부호 포함
      beforeAmount: beforeTotalAmount,
      afterAmount: afterTotalAmount,
      balanceDetail: {
        mainBalanceChange: mainChange,
        mainBeforeAmount: beforeMainBalance,
        mainAfterAmount: afterMainBalance,
        bonusBalanceChange: bonusChange,
        bonusBeforeAmount: beforeBonusBalance,
        bonusAfterAmount: afterBonusBalance,
      },
      adminDetail: {
        adminUserId,
        reasonCode,
        internalNote: internalNote || `Admin adjustment: ${balanceType} ${operation} ${amount}`,
      },
    });

    await this.transactionRepository.create(transaction);

    return {
      wallet: savedWallet,
      beforeMainBalance,
      afterMainBalance,
      beforeBonusBalance,
      afterBonusBalance,
      mainBalanceChange: mainChange,
      bonusBalanceChange: bonusChange,
    };
  }
}
