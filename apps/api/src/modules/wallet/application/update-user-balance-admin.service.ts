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
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma, TransactionType, TransactionStatus, AdjustmentReasonCode } from '@prisma/client';
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
  beforeCash: Prisma.Decimal;
  afterCash: Prisma.Decimal;
  beforeBonus: Prisma.Decimal;
  afterBonus: Prisma.Decimal;
  cashChange: Prisma.Decimal;
  bonusChange: Prisma.Decimal;
}

/**
 * 관리자용 사용자 잔액 업데이트 Use Case
 *
 * 관리자가 특정 사용자의 잔액을 증가 또는 감소시킵니다.
 * 사용자 존재 여부를 검증한 후 잔액을 업데이트합니다.
 * - Cash 잔액만 업데이트
 * - Bonus 잔액만 업데이트
 * - 총 잔액에서 차감 (Cash 우선, 부족하면 Bonus에서 차감)
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
    // TODO: updateBalance 메서드도 구조에 맞게 변경되었는지 확인 필요 (현재는 Cash, Bonus 중심 로직만 있음. Reward, Lock, Vault 등은 별도 로직이 필요하거나 updateBalance 확장 필요)
    // 현재 구현된 updateBalance는 (Type, Operation, Amount)를 받아서 Cash/Bonus를 조작함.
    // const {
    //   mainChange: cashChange,
    //   bonusChange,
    //   beforeMainBalance: beforeCash,
    //   afterMainBalance: afterCash,
    //   beforeBonusBalance: beforeBonus,
    //   afterBonusBalance: afterBonus,
    // } = wallet.updateBalance(balanceType, operation, amount);

    // // 6. 저장
    // const savedWallet = await this.walletRepository.upsert(wallet);

    // // 7. 변경량 및 Total 계산
    // const totalChange = cashChange.add(bonusChange);
    // // 어드민 트랜잭션 기록용 Total은 Cash + Bonus만 고려 (기존 로직 유지)
    // // 만약 Reward 등도 포함해야 한다면 Transaction 로직 수정 필요
    // const beforeTotalAmount = beforeCash.add(beforeBonus);
    // const afterTotalAmount = afterCash.add(afterBonus);

    // const transaction = WalletTransaction.create({
    //   userId,
    //   type: TransactionType.ADMIN_ADJUST,
    //   status: TransactionStatus.COMPLETED,
    //   currency,
    //   amount: totalChange, // 부호 포함
    //   beforeAmount: beforeTotalAmount,
    //   afterAmount: afterTotalAmount,
    //   balanceDetail: {
    //     cashBalanceChange: cashChange,
    //     cashBeforeAmount: beforeCash,
    //     cashAfterAmount: afterCash,
    //     bonusBalanceChange: bonusChange,
    //     bonusBeforeAmount: beforeBonus,
    //     bonusAfterAmount: afterBonus,
    //   },
    //   adminDetail: {
    //     adminUserId,
    //     reasonCode,
    //     internalNote: internalNote || `Admin adjustment: ${balanceType} ${operation} ${amount}`,
    //   },
    // });

    // await this.transactionRepository.create(transaction);

    // return {
    //   wallet: savedWallet,
    //   beforeCash,
    //   afterCash,
    //   beforeBonus,
    //   afterBonus,
    //   cashChange,
    //   bonusChange,
    // };
    return {
      wallet,
      beforeCash: new Prisma.Decimal(0),
      afterCash: new Prisma.Decimal(0),
      beforeBonus: new Prisma.Decimal(0),
      afterBonus: new Prisma.Decimal(0),
      cashChange: new Prisma.Decimal(0),
      bonusChange: new Prisma.Decimal(0),
    };
  }
}
