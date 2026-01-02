// src/modules/deposit/application/reject-deposit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { DepositDetailStatus, TransactionStatus } from '@repo/database';
import type { RequestClientInfo } from 'src/common/http/types';
import {
  DepositNotFoundException,
  DepositAlreadyProcessedException,
} from '../domain';

interface RejectDepositParams {
  id: bigint;
  failureReason: string;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface RejectDepositResult {
  success: boolean;
}

@Injectable()
export class RejectDepositService {
  private readonly logger = new Logger(RejectDepositService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async execute(params: RejectDepositParams): Promise<RejectDepositResult> {
    const { id, failureReason, adminId, requestInfo } = params;

    return await this.prismaService.$transaction(async (tx) => {
      // 1. DepositDetail 조회 및 검증
      const deposit = await tx.depositDetail.findUnique({
        where: { id },
        include: {
          transaction: true,
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

      // 2. Transaction 상태 업데이트
      await tx.transaction.update({
        where: { id: deposit.transactionId },
        data: {
          status: TransactionStatus.CANCELLED,
        },
      });

      // 3. DepositDetail 상태 업데이트
      await tx.depositDetail.update({
        where: { id },
        data: {
          status: DepositDetailStatus.REJECTED,
          failureReason,
          processedBy: adminId,
          failedAt: new Date(),
        },
      });

      return { success: true };
    });
  }
}

