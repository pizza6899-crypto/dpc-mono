import {
  QuestMaster as PrismaQuestMaster,
  UserQuest as PrismaUserQuest,
  UserRewardHistory as PrismaUserRewardHistory,
  QuestGoal as PrismaQuestGoal,
  QuestReward as PrismaQuestReward,
  QuestTranslation as PrismaQuestTranslation,
  Prisma,
} from '@prisma/client';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';
import {
  QuestMaster,
  UserQuest,
  UserRewardHistory,
  QuestGoal,
  QuestReward,
  QuestTranslation,
  QuestMetadata,
  QuestEntryRule,
  UserQuestProgressData,
  UserRewardHistoryDetail,
  QuestMatchRule,
  QuestRewardValue,
} from '../domain/models';

export class QuestCoreMapper {
  /**
   * JSON 내의 BigInt 직렬화/역직렬화를 위한 헬퍼
   */
  private static serializeJson(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(
      JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
    );
  }

  private static json(val: any): Prisma.InputJsonValue {
    return this.serializeJson(val) as Prisma.InputJsonValue;
  }

  private static parseMetadata(json: any): QuestMetadata {
    const data = json as any;
    if (!data) return {};
    return {
      ...data,
      iconFileId: data.iconFileId ? Cast.bigint(data.iconFileId) : undefined,
    };
  }

  private static parseProgressData(json: any): UserQuestProgressData {
    const data = json as any;
    if (!data) return {};
    return {
      ...data,
    };
  }

  // --- Domain -> Persistence (Create/Update) ---

  /**
   * QuestMaster: Domain -> Persistence (Create with relations)
   */
  static toQuestMasterFullCreatePersistence(entity: QuestMaster): Prisma.QuestMasterCreateInput {
    return {
      type: entity.type,
      category: entity.category,
      resetCycle: entity.resetCycle,
      maxAttempts: entity.maxAttempts,
      isActive: entity.isActive,
      metadata: this.json(entity.metadata),
      entryRule: this.json(entity.entryRule),
      updatedByUser: entity.updatedBy ? { connect: { id: entity.updatedBy } } : undefined,
      startTime: entity.startTime,
      endTime: entity.endTime,
      parent: entity.parentId ? { connect: { id: entity.parentId } } : undefined,
      precedingId: entity.precedingId,
      goals: {
        create: entity.goals.map((g) => this.toQuestGoalPersistence(g)),
      },
      rewards: {
        create: entity.rewards.map((r) => this.toQuestRewardPersistence(r)),
      },
      translations: {
        create: entity.translations.map((t) => this.toQuestTranslationPersistence(t)),
      },
    };
  }

  /**
   * QuestMaster: Domain -> Persistence (Update with relations)
   */
  static toQuestMasterFullUpdatePersistence(entity: QuestMaster): Prisma.QuestMasterUpdateInput {
    return {
      type: entity.type,
      category: entity.category,
      resetCycle: entity.resetCycle,
      maxAttempts: entity.maxAttempts,
      isActive: entity.isActive,
      metadata: this.json(entity.metadata),
      entryRule: this.json(entity.entryRule),
      updatedByUser: entity.updatedBy ? { connect: { id: entity.updatedBy } } : undefined,
      startTime: entity.startTime,
      endTime: entity.endTime,
      parent: entity.parentId ? { connect: { id: entity.parentId } } : undefined,
      precedingId: entity.precedingId,
      goals: {
        deleteMany: {},
        create: entity.goals.map((g) => this.toQuestGoalPersistence(g)),
      },
      rewards: {
        deleteMany: {},
        create: entity.rewards.map((r) => this.toQuestRewardPersistence(r)),
      },
      translations: {
        deleteMany: {},
        create: entity.translations.map((t) => this.toQuestTranslationPersistence(t)),
      },
    };
  }

  private static toQuestGoalPersistence(entity: QuestGoal): Prisma.QuestGoalCreateWithoutQuestMasterInput {
    return {
      currency: entity.currency,
      targetAmount: entity.targetAmount,
      targetCount: entity.targetCount,
      matchRule: this.json(entity.matchRule),
    };
  }

  private static toQuestRewardPersistence(entity: QuestReward): Prisma.QuestRewardCreateWithoutQuestMasterInput {
    return {
      type: entity.type,
      currency: entity.currency,
      value: this.json(entity.value),
      expireDays: entity.expireDays,
      wageringMultiplier: entity.wageringMultiplier,
    };
  }

  private static toQuestTranslationPersistence(entity: QuestTranslation): Prisma.QuestTranslationCreateWithoutQuestMasterInput {
    return {
      language: entity.language,
      title: entity.title,
      description: entity.description,
    };
  }

  /**
   * UserQuest: Domain -> Persistence (Create/Update Shared)
   */
  private static mapUserQuestShared(entity: UserQuest): Prisma.UserQuestUpdateInput {
    return {
      status: entity.status,
      progressData: this.json(entity.progressData),
      completedAt: entity.completedAt,
      claimedAt: entity.claimedAt,
      updatedAt: new Date(),
    };
  }

  static toUserQuestPersistence(entity: UserQuest): Prisma.UserQuestUpdateInput {
    return this.mapUserQuestShared(entity);
  }

  static toUserQuestCreatePersistence(entity: UserQuest): Prisma.UserQuestUncheckedCreateInput {
    return {
      ...(this.mapUserQuestShared(entity) as Prisma.UserQuestUncheckedCreateInput),
      userId: entity.userId,
      questMasterId: entity.questMasterId,
      cycleId: entity.cycleId,
      currency: entity.currency,
    };
  }

  static toUserRewardHistoryCreatePersistence(entity: UserRewardHistory): Prisma.UserRewardHistoryUncheckedCreateInput {
    return {
      userQuestId: entity.userQuestId,
      userId: entity.userId,
      type: entity.type,
      amount: entity.amount,
      currency: entity.currency,
      detail: this.json(entity.detail),
      wageringId: entity.wageringId,
    };
  }

  // --- Persistence -> Domain ---

  static toQuestMasterDomain(record: PersistenceOf<PrismaQuestMaster> & {
    goals?: PersistenceOf<PrismaQuestGoal>[],
    rewards?: PersistenceOf<PrismaQuestReward>[],
    translations?: PersistenceOf<PrismaQuestTranslation>[]
  }): QuestMaster {
    return QuestMaster.fromPersistence({
      id: Cast.bigint(record.id),
      type: record.type as any,
      category: record.category as any,
      resetCycle: record.resetCycle as any,
      maxAttempts: record.maxAttempts,
      isActive: record.isActive,
      parentId: Cast.bigint(record.parentId),
      precedingId: Cast.bigint(record.precedingId),
      metadata: this.parseMetadata(record.metadata),
      entryRule: record.entryRule as unknown as QuestEntryRule,
      updatedBy: Cast.bigint(record.updatedBy),
      startTime: Cast.date(record.startTime),
      endTime: Cast.date(record.endTime),
      createdAt: Cast.date(record.createdAt),
      updatedAt: Cast.date(record.updatedAt),
      goals: record.goals?.map((g) => this.toQuestGoalDomain(g)),
      rewards: record.rewards?.map((r) => this.toQuestRewardDomain(r)),
      translations: record.translations?.map((t) => this.toQuestTranslationDomain(t)),
    });
  }

  static toQuestGoalDomain(record: PersistenceOf<PrismaQuestGoal>): QuestGoal {
    return QuestGoal.fromPersistence({
      id: Cast.bigint(record.id),
      questMasterId: Cast.bigint(record.questMasterId),
      currency: record.currency as any,
      targetAmount: Cast.decimal(record.targetAmount),
      targetCount: record.targetCount,
      matchRule: record.matchRule as unknown as QuestMatchRule,
    });
  }

  static toQuestRewardDomain(record: PersistenceOf<PrismaQuestReward>): QuestReward {
    return QuestReward.fromPersistence({
      id: Cast.bigint(record.id),
      questMasterId: Cast.bigint(record.questMasterId),
      type: record.type as any,
      currency: record.currency as any,
      value: record.value as unknown as QuestRewardValue,
      expireDays: record.expireDays,
      wageringMultiplier: Cast.decimal(record.wageringMultiplier),
    });
  }

  static toQuestTranslationDomain(record: PersistenceOf<PrismaQuestTranslation>): QuestTranslation {
    return QuestTranslation.fromPersistence({
      id: Cast.bigint(record.id),
      questMasterId: Cast.bigint(record.questMasterId),
      language: record.language as any,
      title: record.title,
      description: record.description,
    });
  }

  static toUserQuestDomain(record: PersistenceOf<PrismaUserQuest>): UserQuest {
    return UserQuest.fromPersistence({
      id: Cast.bigint(record.id),
      userId: Cast.bigint(record.userId),
      questMasterId: Cast.bigint(record.questMasterId),
      sourceId: Cast.bigint(record.sourceId),
      cycleId: record.cycleId as any,
      currency: record.currency as any,
      status: record.status as any,
      progressData: this.parseProgressData(record.progressData),
      completedAt: Cast.date(record.completedAt),
      claimedAt: Cast.date(record.claimedAt),
      createdAt: Cast.date(record.createdAt),
      updatedAt: Cast.date(record.updatedAt),
    });
  }

  static toUserRewardHistoryDomain(record: PersistenceOf<PrismaUserRewardHistory>): UserRewardHistory {
    return UserRewardHistory.fromPersistence({
      id: Cast.bigint(record.id),
      userQuestId: Cast.bigint(record.userQuestId),
      userId: Cast.bigint(record.userId),
      type: record.type as any,
      amount: Cast.decimal(record.amount),
      currency: record.currency as any,
      detail: record.detail as unknown as UserRewardHistoryDetail,
      wageringId: Cast.bigint(record.wageringId),
    });
  }
}
