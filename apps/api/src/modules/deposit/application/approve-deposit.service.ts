// src/modules/deposit/application/approve-deposit.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@repo/database';
import { TransactionStatus } from '@repo/database';
import type { RequestClientInfo } from 'src/common/http/types';
import { ApproveDepositResponseDto } from '../dtos/admin-deposit-response.dto';
import { UpdateUserBalanceAdminService } from '../../wallet/application/update-user-balance-admin.service';
import {
  BalanceType,
  UpdateOperation,
} from '../../wallet/application/update-user-balance.service';
import { UserStatsService } from '../../user-stats/application/user-stats.service';
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

interface ApproveDepositResult extends ApproveDepositResponseDto {}

@Injectable()
export class ApproveDepositService {
  private readonly logger = new Logger(ApproveDepositService.name);

  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly updateUserBalanceAdminService: UpdateUserBalanceAdminService,
    private readonly userStatsService: UserStatsService,
  ) {}

  @Transactional()
  async execute(params: ApproveDepositParams): Promise<ApproveDepositResult> {
    const { id, actuallyPaid, transactionHash, memo, adminId, requestInfo } =
      params;

    // 1. DepositDetail 조회 (transaction 포함)
    const deposit = await this.depositRepository.getById(id, {
      transaction: true,
      BankConfig: true,
    });

    // 2. 엔티티 비즈니스 로직 실행 (승인 처리)
    deposit.approve(actuallyPaid, adminId, transactionHash, memo);

    // 3. Transaction의 userId 조회
    const userId = await this.depositRepository.getTransactionUserId(
      deposit.transactionId,
    );

    if (!userId) {
      throw new Error('Transaction information not found');
    }

    // 4. 잔액 업데이트

    const balanceUpdate = await this.updateUserBalanceAdminService.execute({
      userId,
      currency: deposit.depositCurrency,
      balanceType: BalanceType.MAIN,
      operation: UpdateOperation.ADD,
      amount: actuallyPaid,
    });

    // 5. DepositDetail 상태 업데이트 (엔티티의 변경사항 반영)
    await this.depositRepository.update(deposit);

    // 6. UserStats 업데이트
    // TODO: UserStatsService가 tx를 받는지 확인 필요
    // await this.userStatsService.updateDepositStats(
    //   userId,
    //   deposit.depositCurrency,
    //   actuallyPaid,
    // );

    // 7. Transaction 상태 업데이트
    // TODO: Transaction Repository 또는 서비스 필요
    // await transactionService.updateStatus(...)

    // 8. BankConfig 통계 업데이트
    // TODO: BankConfig Repository 또는 서비스 필요
    // if (deposit.bankConfigId) {
    //   await bankConfigService.incrementStats(...)
    // }

    return {
      success: true,
      transactionId: deposit.transactionId.toString(),
      actuallyPaid: actuallyPaid.toString(),
      bonusAmount: '0', // TODO: 보너스 계산 로직 추가
    };
  }
}

