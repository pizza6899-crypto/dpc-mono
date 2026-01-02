// src/modules/deposit/application/get-deposit-stats.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import {
  DepositDetailStatus,
  DepositMethodType,
} from '@repo/database';
import type { RequestClientInfo } from 'src/common/http/types';

interface GetDepositStatsParams {
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface GetDepositStatsResult {
  todayTotalAmount: string;
  pendingCount: number;
  methodDistribution: {
    crypto: number;
    bank: number;
  };
}

@Injectable()
export class GetDepositStatsService {
  private readonly logger = new Logger(GetDepositStatsService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  async execute(
    params: GetDepositStatsParams,
  ): Promise<GetDepositStatsResult> {
    const { adminId, requestInfo } = params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayDeposits, pendingDeposits, methodStats] = await Promise.all([
      // 오늘 총 입금액
      this.tx.depositDetail.aggregate({
        where: {
          status: DepositDetailStatus.COMPLETED,
          createdAt: {
            gte: today,
          },
        },
        _sum: {
          actuallyPaid: true,
        },
      }),
      // 대기 중인 요청 수
      this.tx.depositDetail.count({
        where: {
          status: {
            in: [DepositDetailStatus.PENDING, DepositDetailStatus.CONFIRMING],
          },
        },
      }),
      // 수단별 점유율
      this.tx.depositDetail.groupBy({
        by: ['methodType'],
        where: {
          status: DepositDetailStatus.COMPLETED,
          createdAt: {
            gte: today,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const methodDistribution = {
      crypto:
        methodStats.find((s) => s.methodType === DepositMethodType.CRYPTO_WALLET)
          ?._count.id || 0,
      bank:
        methodStats.find((s) => s.methodType === DepositMethodType.BANK_TRANSFER)
          ?._count.id || 0,
    };

    return {
      todayTotalAmount:
        todayDeposits._sum.actuallyPaid?.toString() || '0',
      pendingCount: pendingDeposits,
      methodDistribution,
    };
  }
}

