import { Injectable } from '@nestjs/common';
import { WageringRequirement } from '../domain';
import { Prisma } from '@prisma/client';
import type { WageringRequirement as PrismaWageringRequirement } from '@prisma/client';

@Injectable()
export class WageringRequirementMapper {
    toDomain(prismaModel: PrismaWageringRequirement): WageringRequirement {
        return WageringRequirement.fromPersistence({
            id: prismaModel.id,
            userId: prismaModel.userId,
            currency: prismaModel.currency,
            sourceType: prismaModel.sourceType,
            requiredAmount: prismaModel.requiredAmount,
            fulfilledAmount: prismaModel.fulfilledAmount,
            autoCancelThreshold: prismaModel.autoCancelThreshold,
            isAutoCancelable: prismaModel.isAutoCancelable,
            principalAmount: prismaModel.principalAmount,
            multiplier: prismaModel.multiplier,
            lockedAmount: prismaModel.lockedAmount,
            appliedConfig: prismaModel.appliedConfig,
            maxCashConversion: prismaModel.maxCashConversion,
            convertedAmount: prismaModel.convertedAmount,
            isPaused: prismaModel.isPaused,
            status: prismaModel.status,
            priority: prismaModel.priority,
            depositDetailId: prismaModel.depositDetailId,
            userPromotionId: prismaModel.userPromotionId,
            createdAt: prismaModel.createdAt,
            updatedAt: prismaModel.updatedAt,
            expiresAt: prismaModel.expiresAt,
            lastContributedAt: prismaModel.lastContributedAt,
            completedAt: prismaModel.completedAt,
            cancelledAt: prismaModel.cancelledAt,
            cancellationNote: prismaModel.cancellationNote,
            cancellationReasonType: prismaModel.cancellationReasonType,
            cancelledBy: prismaModel.cancelledBy,
            balanceAtCancellation: prismaModel.balanceAtCancellation,
            forfeitedAmount: prismaModel.forfeitedAmount,
        });
    }

    toPrisma(domain: WageringRequirement): Omit<PrismaWageringRequirement, 'createdAt' | 'updatedAt'> {
        return {
            id: domain.id,
            userId: domain.userId,
            currency: domain.currency,
            sourceType: domain.sourceType,
            requiredAmount: domain.requiredAmount,
            fulfilledAmount: domain.fulfilledAmount,
            autoCancelThreshold: domain.autoCancelThreshold,
            isAutoCancelable: domain.isAutoCancelable,
            principalAmount: domain.principalAmount,
            multiplier: domain.multiplier,
            lockedAmount: domain.lockedAmount,
            appliedConfig: (domain.appliedConfig ?? Prisma.JsonNull) as any,
            maxCashConversion: domain.maxCashConversion,
            convertedAmount: domain.convertedAmount,
            isPaused: domain.isPaused,
            status: domain.status,
            priority: domain.priority,
            depositDetailId: domain.depositDetailId,
            userPromotionId: domain.userPromotionId,
            expiresAt: domain.expiresAt,
            lastContributedAt: domain.lastContributedAt,
            completedAt: domain.completedAt,
            cancelledAt: domain.cancelledAt,
            cancellationNote: domain.cancellationNote,
            cancellationReasonType: domain.cancellationReasonType,
            cancelledBy: domain.cancelledBy,
            balanceAtCancellation: domain.balanceAtCancellation,
            forfeitedAmount: domain.forfeitedAmount,
        };
    }
}
