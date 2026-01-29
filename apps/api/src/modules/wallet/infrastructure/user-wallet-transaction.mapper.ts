// src/modules/wallet/infrastructure/wallet-transaction.mapper.ts
import { Injectable } from '@nestjs/common';
import { UserWalletTransaction } from '../domain';
import { UserWalletTransaction as PrismaUserWalletTransaction } from '@prisma/client';

/**
 * WalletTransaction Mapper
 * 
 * Prisma WalletTransaction 모델과 Domain WalletTransaction 엔티티 간 변환을 담당합니다.
 */
@Injectable()
export class UserWalletTransactionMapper {
    /**
     * Prisma 모델 → Domain 엔티티 변환
     */
    toDomain(prismaModel: PrismaUserWalletTransaction): UserWalletTransaction {
        return UserWalletTransaction.fromPersistence({
            id: prismaModel.id,
            createdAt: prismaModel.createdAt,
            type: prismaModel.type,
            balanceType: prismaModel.balanceType,
            amount: prismaModel.amount,
            balanceBefore: prismaModel.balanceBefore,
            balanceAfter: prismaModel.balanceAfter,
            status: prismaModel.status,
            referenceId: prismaModel.referenceId,
            metadata: prismaModel.metadata,
            ipAddress: prismaModel.ipAddress,
            countryCode: prismaModel.countryCode,
            userId: prismaModel.userId,
            currency: prismaModel.currency,
        });
    }

    /**
     * Domain 엔티티 → Prisma 모델 변환
     */
    toPrisma(domain: UserWalletTransaction): any {
        return {
            userId: domain.userId,
            currency: domain.currency,
            type: domain.type,
            balanceType: domain.balanceType,
            amount: domain.amount,
            balanceBefore: domain.balanceBefore,
            balanceAfter: domain.balanceAfter,
            status: domain.status,
            referenceId: domain.referenceId,
            metadata: domain.metadata as any,
            ipAddress: domain.ipAddress,
            countryCode: domain.countryCode,
            createdAt: domain.createdAt,
        };
    }
}
