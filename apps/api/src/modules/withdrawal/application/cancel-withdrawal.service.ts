import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import {
  UserWalletBalanceType,
  UserWalletTransactionType,
} from '@prisma/client';
import { WithdrawalNotFoundException } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export interface CancelWithdrawalParams {
  userId: bigint;
  withdrawalId: bigint;
}

export interface CancelWithdrawalResult {
  withdrawalId: bigint;
  status: string;
  cancelledAt: Date;
}

@Injectable()
export class CancelWithdrawalService {
  private readonly logger = new Logger(CancelWithdrawalService.name);

  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly repository: WithdrawalRepositoryPort,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute(
    params: CancelWithdrawalParams,
  ): Promise<CancelWithdrawalResult> {
    const { userId, withdrawalId } = params;

    // 0. 락 획득 (출금 건별 동시 처리 방지)
    await this.advisoryLockService.acquireLock(
      LockNamespace.WITHDRAWAL,
      withdrawalId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 1. 출금 조회
    const withdrawal = await this.repository.getById(withdrawalId);

    // 2. 소유권 확인
    if (withdrawal.userId !== userId) {
      throw new WithdrawalNotFoundException();
    }

    // 3. 취소 (엔티티에서 상태 검증)
    withdrawal.cancel();

    // 4. 저장
    await this.repository.save(withdrawal);

    // 5. 잔액 복원 (mainBalance에 복원)
    await this.updateUserBalanceService.updateBalance(
      {
        userId,
        currency: withdrawal.currency,
        amount: withdrawal.requestedAmount,
        operation: UpdateOperation.ADD,
        balanceType: UserWalletBalanceType.CASH,
        transactionType: UserWalletTransactionType.REFUND, // 환불 타입으로 기록
        referenceId: withdrawal.id,
      },
      {
        internalNote: 'Withdrawal cancelled by user - balance restored',
        actionName: WalletActionName.CANCEL_WITHDRAWAL,
      },
    );

    return {
      withdrawalId: withdrawal.id,
      status: withdrawal.status,
      cancelledAt: withdrawal.props.cancelledAt!,
    };
  }
}
