import { Injectable } from '@nestjs/common';
import {
  CompAccount,
  CompAccountTransaction,
  CompConfig as DomainCompConfig,
  CompDailySettlement as DomainCompDailySettlement,
} from '../domain';
import {
  UserCompAccount,
  CompAccountTransaction as PrismaCompAccountTransaction,
  CompConfig,
  CompDailySettlement,
  Prisma,
} from '@prisma/client';

@Injectable()
export class CompMapper {
  toDomain(model: UserCompAccount): CompAccount {
    return CompAccount.rehydrate({
      id: model.id,
      userId: model.userId,
      currency: model.currency,
      totalEarned: model.totalEarned,
      totalUsed: model.totalUsed,
      isFrozen: model.isFrozen,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  toPersistence(entity: CompAccount): Partial<UserCompAccount> {
    return {
      id: entity.id === 0n ? undefined : entity.id,
      userId: entity.userId,
      currency: entity.currency,
      totalEarned: entity.totalEarned,
      totalUsed: entity.totalUsed,
      isFrozen: entity.isFrozen,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toTransactionDomain(
    model: PrismaCompAccountTransaction,
  ): CompAccountTransaction {
    return CompAccountTransaction.rehydrate({
      id: model.id,
      compAccountId: model.compAccountId,
      amount: model.amount,
      appliedRate: model.appliedRate,
      type: model.type,
      referenceId: model.referenceId,
      processedBy: model.processedBy,
      parentTransactionId: model.parentTransactionId,
      metadata: model.metadata,
      description: model.description,
      createdAt: model.createdAt,
    });
  }

  toTransactionPersistence(
    entity: CompAccountTransaction,
  ): Partial<PrismaCompAccountTransaction> {
    return {
      id: entity.id === BigInt(0) ? undefined : entity.id,
      compAccountId: entity.compAccountId,
      amount: entity.amount,
      appliedRate: entity.appliedRate,
      type: entity.type,
      referenceId: entity.referenceId,
      processedBy: entity.processedBy,
      parentTransactionId: entity.parentTransactionId,
      metadata: entity.metadata ?? Prisma.JsonNull,
      description: entity.description,
      createdAt: entity.createdAt,
    };
  }

  toConfigDomain(model: CompConfig): DomainCompConfig {
    return DomainCompConfig.rehydrate({
      id: model.id,
      currency: model.currency,
      isEarnEnabled: model.isEarnEnabled,
      isSettlementEnabled: model.isSettlementEnabled,
      maxDailyEarnPerUser: model.maxDailyEarnPerUser,
      minSettlementAmount: model.minSettlementAmount,
      description: model.description,
      updatedAt: model.updatedAt,
    });
  }

  toConfigPersistence(entity: DomainCompConfig): Partial<CompConfig> {
    return {
      id: entity.id === BigInt(0) ? undefined : entity.id,
      currency: entity.currency,
      isEarnEnabled: entity.isEarnEnabled,
      isSettlementEnabled: entity.isSettlementEnabled,
      maxDailyEarnPerUser: entity.maxDailyEarnPerUser,
      minSettlementAmount: entity.minSettlementAmount,
      description: entity.description,
      updatedAt: new Date(), // Always update timestamp
    };
  }

  toDailySettlementDomain(
    model: CompDailySettlement,
  ): DomainCompDailySettlement {
    return DomainCompDailySettlement.rehydrate({
      id: model.id,
      userId: model.userId,
      currency: model.currency,
      date: model.date,
      totalEarned: model.totalEarned,
      status: model.status,
      rewardId: model.rewardId,
      failureReason: model.failureReason,
      processedAt: model.processedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  toDailySettlementPersistence(
    entity: DomainCompDailySettlement,
  ): Partial<CompDailySettlement> {
    return {
      id: entity.id === BigInt(0) ? undefined : entity.id,
      userId: entity.userId,
      currency: entity.currency,
      date: entity.date,
      totalEarned: entity.totalEarned,
      status: entity.status,
      rewardId: entity.rewardId,
      failureReason: entity.failureReason,
      processedAt: entity.processedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
