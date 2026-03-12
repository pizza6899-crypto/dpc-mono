import { QuestMaster } from '../domain/models';

export interface QuestMasterRepository {
  findById(id: bigint): Promise<QuestMaster | null>;
  findAllActive(): Promise<QuestMaster[]>;
  findByType(type: string): Promise<QuestMaster[]>;
  save(questMaster: QuestMaster): Promise<bigint>;
}
