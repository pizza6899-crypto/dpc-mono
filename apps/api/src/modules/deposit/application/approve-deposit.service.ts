// src/modules/deposit/application/approve-deposit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Prisma } from '@repo/database';
import {
  DepositDetailStatus,
  TransactionStatus,
} from '@repo/database';
import type { RequestClientInfo } from 'src/common/http/types';
import { ApproveDepositResponseDto } from '../dtos/admin-deposit-response.dto';
import { UpdateUserBalanceAdminService } from '../../wallet/application/update-user-balance-admin.service';
import {
  BalanceType,
  UpdateOperation,
} from '../../wallet/application/update-user-balance.service';
import { UserStatsService } from '../../user-stats/application/user-stats.service';
import {
  DepositNotFoundException,
  DepositAlreadyProcessedException,
} from '../domain';

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
    private readonly prismaService: PrismaService,
    private readonly updateUserBalanceAdminService: UpdateUserBalanceAdminService,
    private readonly userStatsService: UserStatsService,
  ) {}

  async execute(params: ApproveDepositParams): Promise<ApproveDepositResult> {
    const { id, actuallyPaid, transactionHash, memo, adminId, requestInfo } =
      params;

    return await this.prismaService.$transaction(async (tx) => {
      // 1. DepositDetail 조회 및 검증
      const deposit = await tx.depositDetail.findUnique({
        where: { id },
        include: {
          transaction: true,
          BankConfig: true,
        },
      });

      if (!deposit) {
        throw new DepositNotFoundException(id);
      }

      if (
        deposit.status !== DepositDetailStatus.PENDING &&
        deposit.status !== DepositDetailStatus.CONFIRMING
      ) {
        throw new DepositAlreadyProcessedException(id, deposit.status);
      }

      // 2. 잔액 업데이트
      const balanceUpdate = await this.updateUserBalanceAdminService.execute({
        userId: deposit.transaction.userId,
        currency: deposit.depositCurrency,
        balanceType: BalanceType.MAIN,
        operation: UpdateOperation.ADD,
        amount: actuallyPaid,
      });

      // 3. Transaction 상태 업데이트
      await tx.transaction.update({
        where: { id: deposit.transactionId },
        data: {
          status: TransactionStatus.COMPLETED,
          amount: actuallyPaid,
          afterAmount: balanceUpdate.wallet.mainBalance.add(
            balanceUpdate.wallet.bonusBalance,
          ),
        },
      });

      // 4. DepositDetail 상태 업데이트
      await tx.depositDetail.update({
        where: { id },
        data: {
          status: DepositDetailStatus.COMPLETED,
          actuallyPaid,
          transactionHash: transactionHash || deposit.transactionHash,
          adminNote: memo || deposit.adminNote,
          processedBy: adminId,
          confirmedAt: new Date(),
        },
      });

      // 5. UserStats 업데이트
      await this.userStatsService.updateDepositStats(
        tx,
        deposit.transaction.userId,
        deposit.depositCurrency,
        actuallyPaid,
      );

      // 6. BankConfig 통계 업데이트 (있는 경우)
      if (deposit.bankConfigId && deposit.BankConfig) {
        await tx.bankConfig.update({
          where: { id: deposit.bankConfigId },
          data: {
            totalDeposits: { increment: 1 },
            totalDepositAmount: { increment: actuallyPaid },
          },
        });
      }

      return {
        success: true,
        transactionId: deposit.transactionId.toString(),
        actuallyPaid: actuallyPaid.toString(),
        bonusAmount: '0', // TODO: 보너스 계산 로직 추가
      };
    });
  }
}

