import { QuestType } from '@prisma/client';
import { QuestMaster } from '../domain/models';

export interface QuestMasterListQuery {
  skip?: number;
  take?: number;
  id?: bigint;
  type?: QuestType;
  isActive?: boolean;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuestMasterRepository {
  findById(id: bigint): Promise<QuestMaster | null>;
  findAllActive(): Promise<QuestMaster[]>;
  findByType(type: string): Promise<QuestMaster[]>;
  list(query: QuestMasterListQuery): Promise<{ items: QuestMaster[]; total: number }>;
  save(questMaster: QuestMaster): Promise<bigint>;
}
