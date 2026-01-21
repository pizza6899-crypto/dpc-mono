import { Injectable } from '@nestjs/common';
import { WageringRequirement } from '../domain';
import type { WageringRequirement as PrismaWageringRequirement } from '@prisma/client';

@Injectable()
export class WageringRequirementMapper {
    toDomain(prismaModel: PrismaWageringRequirement): WageringRequirement {
        return WageringRequirement.rehydrate({
            id: prismaModel.id,
            uid: prismaModel.uid,
            userId: prismaModel.userId,
            currency: prismaModel.currency,
            sourceType: prismaModel.sourceType,
            requiredAmount: prismaModel.requiredAmount,
            currentAmount: prismaModel.currentAmount,
            cancellationBalanceThreshold: prismaModel.cancellationBalanceThreshold,
            status: prismaModel.status,
            priority: prismaModel.priority,
            depositDetailId: prismaModel.depositDetailId,
            userPromotionId: prismaModel.userPromotionId,
            createdAt: prismaModel.createdAt,
            updatedAt: prismaModel.updatedAt,
            expiresAt: prismaModel.expiresAt,
            completedAt: prismaModel.completedAt,
            cancelledAt: prismaModel.cancelledAt,
            cancellationNote: prismaModel.cancellationNote,
        });
    }

    toPrisma(domain: WageringRequirement): Omit<PrismaWageringRequirement, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            uid: domain.uid,
            userId: domain.userId,
            currency: domain.currency,
            sourceType: domain.props.sourceType,
            requiredAmount: domain.props.requiredAmount,
            currentAmount: domain.props.currentAmount,
            cancellationBalanceThreshold: domain.props.cancellationBalanceThreshold,
            status: domain.props.status,
            priority: domain.props.priority,
            depositDetailId: domain.props.depositDetailId,
            userPromotionId: domain.props.userPromotionId,
            expiresAt: domain.props.expiresAt,
            completedAt: domain.props.completedAt,
            cancelledAt: domain.props.cancelledAt,
            cancellationNote: domain.props.cancellationNote,
        };
    }
}
