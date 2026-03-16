import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserQuestRepository } from '../ports/user-quest.repository.port';
import { UserQuest } from '../domain/models';
import { QuestCoreMapper } from './quest-core.mapper';

@Injectable()
export class PrismaUserQuestRepository implements UserQuestRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async findById(id: bigint): Promise<UserQuest | null> {
    const record = await this.tx.userQuest.findUnique({
      where: { id },
    });
    return record ? QuestCoreMapper.toUserQuestDomain(record) : null;
  }

  async findOne(userId: bigint, questMasterId: bigint, cycleId: string): Promise<UserQuest | null> {
    const record = await this.tx.userQuest.findUnique({
      where: {
        userId_questMasterId_cycleId: {
          userId,
          questMasterId,
          cycleId,
        },
      },
    });
    return record ? QuestCoreMapper.toUserQuestDomain(record) : null;
  }

  async save(userQuest: UserQuest): Promise<void> {
    if (userQuest.id === 0n) {
      // Create new record
      const data = QuestCoreMapper.toUserQuestCreatePersistence(userQuest);
      await this.tx.userQuest.create({ data });
    } else {
      // Update existing record
      const data = QuestCoreMapper.toUserQuestPersistence(userQuest);
      await this.tx.userQuest.update({
        where: { id: userQuest.id },
        data,
      });
    }
  }

  async findActiveByUser(userId: bigint): Promise<UserQuest[]> {
    const records = await this.tx.userQuest.findMany({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
    });
    return records.map((record) => QuestCoreMapper.toUserQuestDomain(record));
  }

  async findByUserIdAndQuestMasterIds(userId: bigint, masterIds: bigint[]): Promise<UserQuest[]> {
    const records = await this.tx.userQuest.findMany({
      where: {
        userId,
        questMasterId: { in: masterIds },
      },
    });
    return records.map((record) => QuestCoreMapper.toUserQuestDomain(record));
  }

  async findBySourceId(sourceId: bigint): Promise<UserQuest | null> {
    const record = await this.tx.userQuest.findFirst({
      where: { sourceId },
    });
    return record ? QuestCoreMapper.toUserQuestDomain(record) : null;
  }
}
