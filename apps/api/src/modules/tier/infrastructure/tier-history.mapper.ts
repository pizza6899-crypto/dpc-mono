import { Injectable } from '@nestjs/common';
import { TierHistory as TierHistoryModel, Prisma } from '@repo/database';
import { TierHistory, TierChangeType } from '../domain';

@Injectable()
export class TierHistoryMapper {
    toDomain(model: TierHistoryModel): TierHistory {
        return TierHistory.fromPersistence({
            id: model.id,
            uid: model.uid,
            userId: model.userId,
            fromTierId: model.fromTierId,
            toTierId: model.toTierId,
            changeType: model.changeType as unknown as TierChangeType, // Force cast as enums might differ in type ref
            reason: model.reason ?? 'Unknown',
            rollingSnapshot: model.rollingAmountSnap, // Map DB column
            bonusAmount: new Prisma.Decimal(model.bonusAmount ?? 0), // Handle potential null/undefined if any
            createdAt: model.changedAt, // Map DB column
        });
    }

    toPersistence(domain: TierHistory): Prisma.TierHistoryUncheckedCreateInput {
        return {
            id: domain.id ?? undefined,
            uid: domain.uid,
            userId: domain.userId,
            fromTierId: domain.fromTierId,
            toTierId: domain.toTierId,
            changeType: domain.changeType as unknown as any, // Cast to DB Enum type
            reason: domain.reason,
            rollingAmountSnap: domain.rollingSnapshot, // Map to DB column
            bonusAmount: domain.bonusAmount,
            changedAt: domain.createdAt, // Map to DB column
            changeBy: 'SYSTEM', // Default or need field in domain? Domain doesn't have it explicitly yet, maybe add?
        };
    }
}
