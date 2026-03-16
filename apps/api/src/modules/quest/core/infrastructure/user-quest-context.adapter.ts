import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserQuestContextPort, UserQuestEntryContext } from '../ports/user-quest-context.port';
import { DepositDetailStatus, WithdrawalStatus } from '@prisma/client';

@Injectable()
export class UserQuestContextAdapter implements UserQuestContextPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async getEntryContext(userId: bigint): Promise<UserQuestEntryContext> {
    const [depositCount, withdrawalCount] = await Promise.all([
      this.tx.depositDetail.count({
        where: {
          userId,
          status: DepositDetailStatus.COMPLETED,
        },
      }),
      this.tx.withdrawalDetail.count({
        where: {
          userId,
          status: WithdrawalStatus.COMPLETED,
        },
      }),
    ]);

    return {
      totalDepositCount: depositCount,
      totalWithdrawalCount: withdrawalCount,
      hasWithdrawalHistory: withdrawalCount > 0,
    };
  }
}
