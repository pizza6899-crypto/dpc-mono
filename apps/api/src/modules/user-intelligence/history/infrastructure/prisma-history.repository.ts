import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import type {
  HistoryFindOptions,
  IUserIntelligenceHistoryRepositoryPort,
} from '../ports/history-repository.port';
import { UserIntelligenceHistory } from '../domain/user-intelligence-history.entity';

@Injectable()
export class PrismaHistoryRepository implements IUserIntelligenceHistoryRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async save(history: UserIntelligenceHistory): Promise<UserIntelligenceHistory> {
    const created = await this.tx.userIntelligenceHistory.create({
      data: {
        id: history.id,
        userId: history.userId,
        prevTotalScore: history.prevTotalScore,
        nextTotalScore: history.nextTotalScore,
        reason: history.reason,
        createdAt: history.createdAt,
      },
    });

    return UserIntelligenceHistory.rehydrate({
      id: created.id,
      userId: created.userId,
      prevTotalScore: created.prevTotalScore,
      nextTotalScore: created.nextTotalScore,
      reason: created.reason,
      createdAt: created.createdAt,
    });
  }

  async findAndCount(options: HistoryFindOptions): Promise<[UserIntelligenceHistory[], number]> {
    const { userId, startDate, endDate, skip, take } = options;

    const where = {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [records, count] = await Promise.all([
      this.tx.userIntelligenceHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tx.userIntelligenceHistory.count({ where }),
    ]);

    return [
      records.map((r) =>
        UserIntelligenceHistory.rehydrate({
          id: r.id,
          userId: r.userId,
          prevTotalScore: r.prevTotalScore,
          nextTotalScore: r.nextTotalScore,
          reason: r.reason,
          createdAt: r.createdAt,
        }),
      ),
      count,
    ];
  }
}
