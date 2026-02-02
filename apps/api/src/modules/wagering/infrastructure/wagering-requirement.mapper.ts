import { Injectable } from '@nestjs/common';
import { WageringRequirement } from '../domain';
import { Prisma } from '@prisma/client';
import type { WageringRequirement as PrismaWageringRequirement } from '@prisma/client';

@Injectable()
export class WageringRequirementMapper {
    toDomain(prismaModel: PrismaWageringRequirement): WageringRequirement {
        return WageringRequirement.rehydrate({
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
            id: domain.id!,
            userId: domain.userId,
            currency: domain.currency,
            sourceType: domain.props.sourceType,
            requiredAmount: domain.props.requiredAmount,
            fulfilledAmount: domain.props.fulfilledAmount,
            autoCancelThreshold: domain.props.autoCancelThreshold,
            isAutoCancelable: domain.props.isAutoCancelable,
            principalAmount: domain.props.principalAmount,
            multiplier: domain.props.multiplier,
            lockedAmount: domain.props.lockedAmount,
            appliedConfig: (domain.props.appliedConfig ?? Prisma.JsonNull) as any,
            maxCashConversion: domain.props.maxCashConversion,
            convertedAmount: domain.props.convertedAmount,
            isPaused: domain.props.isPaused,
            status: domain.props.status,
            priority: domain.props.priority,
            depositDetailId: domain.props.depositDetailId,
            userPromotionId: domain.props.userPromotionId,
            expiresAt: domain.props.expiresAt,
            lastContributedAt: domain.props.lastContributedAt,
            completedAt: domain.props.completedAt,
            cancelledAt: domain.props.cancelledAt,
            cancellationNote: domain.props.cancellationNote,
            cancellationReasonType: domain.props.cancellationReasonType,
            cancelledBy: domain.props.cancelledBy,
            balanceAtCancellation: domain.props.balanceAtCancellation,
            forfeitedAmount: domain.props.forfeitedAmount,
        };
    }
}
