// src/modules/deposit/application/approve-deposit.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@repo/database';
import { TransactionStatus, TransactionType } from '@repo/database';
import type { RequestClientInfo } from 'src/common/http/types';
import { ApproveDepositResponseDto } from '../dtos/admin-deposit-response.dto';
import { UpdateUserBalanceAdminService } from '../../wallet/application/update-user-balance-admin.service';
import {
  BalanceType,
  UpdateOperation,
} from '../../wallet/application/update-user-balance.service';
import { UserStatsService } from '../../user-stats/application/user-stats.service';
import { DepositAlreadyProcessedException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';

interface ApproveDepositParams {
  id: bigint;
  actuallyPaid: Prisma.Decimal;
  transactionHash: string | undefined;
  memo: string | undefined;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface ApproveDepositResult extends ApproveDepositResponseDto { }

@Injectable()
export class ApproveDepositService {
  private readonly logger = new Logger(ApproveDepositService.name);

  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly updateUserBalanceAdminService: UpdateUserBalanceAdminService,
  ) { }

  @Transactional()
  async execute(params: ApproveDepositParams): Promise<ApproveDepositResult> {
    const { id, actuallyPaid, transactionHash, memo, adminId, requestInfo } =
      params;

    // 1. DepositDetail 조회 (transaction 포함)
    const deposit = await this.depositRepository.getById(id, {
      transaction: true,
      BankConfig: true,
    });

    // 2. 엔티티 비즈니스 로직 실행 전 검증 (이미 처리된 경우 등)
    if (!deposit.canBeProcessed()) {
      throw new DepositAlreadyProcessedException(id, deposit.status);
    }

    // 3. 잔액 업데이트
    const balanceUpdate = await this.updateUserBalanceAdminService.execute({
      userId: deposit.userId,
      currency: deposit.depositCurrency,
      balanceType: BalanceType.MAIN,
      operation: UpdateOperation.ADD,
      amount: actuallyPaid,
    });

    // 4. Transaction 생성 (지연 생성)
    // 기존에 트랜잭션이 없었다면 새로 생성, 있었다면 상태만 업데이트 (현 시나리오는 지연 생성이므로 새로 생성)
    let transactionId = deposit.transactionId;
    if (!transactionId) {
      transactionId = await this.depositRepository.createTransaction({
        userId: deposit.userId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        currency: deposit.depositCurrency,
        amount: actuallyPaid,
        beforeAmount: balanceUpdate.beforeMainBalance,
        afterAmount: balanceUpdate.afterMainBalance,
      });
    } else {
      // 만약 이미 트랜잭션이 있다면 (예: CONFIRMING 상태에서 미리 생성된 경우 - 현재는 없음)
      // TODO: 기존 트랜잭션 상태 업데이트 로직 필요 시 추가
    }

    // 5. 엔티티 승인 처리 (상태 변경 및 트랜잭션 링크)
    deposit.approve(actuallyPaid, adminId, transactionHash, memo, transactionId);

    // 6. DepositDetail 상태 업데이트 (엔티티의 변경사항 반영)
    await this.depositRepository.update(deposit);

    return {
      success: true,
      transactionId: transactionId.toString(),
      actuallyPaid: actuallyPaid.toString(),
      bonusAmount: '0', // TODO: 보너스 계산 로직 추가
    };
  }
}

