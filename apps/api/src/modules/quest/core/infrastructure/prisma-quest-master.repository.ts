import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { QuestType, Prisma } from '@prisma/client';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { QuestMasterRepository, QuestMasterListQuery } from '../ports/quest-master.repository.port';
import { QuestMaster } from '../domain/models';
import { QuestCoreMapper } from './quest-core.mapper';

@Injectable()
export class PrismaQuestMasterRepository implements QuestMasterRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async findById(id: bigint): Promise<QuestMaster | null> {
    const record = await this.tx.questMaster.findUnique({
      where: { id },
      include: { goals: true, rewards: true, translations: true },
    });
    return record ? QuestCoreMapper.toQuestMasterDomain(record as any) : null;
  }

  async findAllActive(): Promise<QuestMaster[]> {
    const records = await this.tx.questMaster.findMany({
      where: { isActive: true },
      include: { goals: true, rewards: true, translations: true },
    });
    return records.map((r) => QuestCoreMapper.toQuestMasterDomain(r as any));
  }

  async findByType(type: QuestType): Promise<QuestMaster[]> {
    const records = await this.tx.questMaster.findMany({
      where: { type, isActive: true },
      include: { goals: true, rewards: true, translations: true },
    });
    return records.map((r) => QuestCoreMapper.toQuestMasterDomain(r as any));
  }

  async list(query: QuestMasterListQuery): Promise<{ items: QuestMaster[]; total: number }> {
    const { skip, take, id, type, category, isActive, keyword, sortBy, sortOrder } = query;

    const where: Prisma.QuestMasterWhereInput = {
      id,
      type,
      category,
      isActive,
      ...(keyword ? {
        translations: {
          some: {
            title: { contains: keyword, mode: 'insensitive' },
          },
        },
      } : {}),
    };

    const [records, total] = await Promise.all([
      this.tx.questMaster.findMany({
        where,
        skip,
        take,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'desc' } : { createdAt: 'desc' },
        include: { goals: true, rewards: true, translations: true },
      }),
      this.tx.questMaster.count({ where }),
    ]);

    return {
      items: records.map((r) => QuestCoreMapper.toQuestMasterDomain(r as any)),
      total,
    };
  }

  async save(questMaster: QuestMaster): Promise<bigint> {
    if (questMaster.id === 0n) {
      // Create
      const data = QuestCoreMapper.toQuestMasterFullCreatePersistence(questMaster);
      const record = await this.tx.questMaster.create({ data });
      return record.id;
    } else {
      // Update
      const data = QuestCoreMapper.toQuestMasterFullUpdatePersistence(questMaster);
      const record = await this.tx.questMaster.update({
        where: { id: questMaster.id },
        data,
      });
      return record.id;
    }
  }
}
