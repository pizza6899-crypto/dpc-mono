import { UserQuest } from '../domain/models';

export interface UserQuestRepository {
  findById(id: bigint): Promise<UserQuest | null>;
  findOne(userId: bigint, questMasterId: bigint, cycleId: string): Promise<UserQuest | null>;
  save(userQuest: UserQuest): Promise<void>;
  findActiveByUser(userId: bigint): Promise<UserQuest[]>;
}
