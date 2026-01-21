// src/modules/wallet/infrastructure/wallet-transaction.mapper.ts
import { Injectable } from '@nestjs/common';
import { WalletTransaction } from '../domain';
import { WalletTransaction as PrismaWalletTransaction } from '@prisma/client';

/**
 * WalletTransaction Mapper
 * 
 * Prisma WalletTransaction 모델과 Domain WalletTransaction 엔티티 간 변환을 담당합니다.
 */
@Injectable()
export class WalletTransactionMapper {
    /**
     * Prisma 모델 → Domain 엔티티 변환
     */
    toDomain(prismaModel: PrismaWalletTransaction): WalletTransaction {
        return WalletTransaction.fromPersistence({
            id: prismaModel.id,
            createdAt: prismaModel.createdAt,
            type: prismaModel.type,
            balanceType: prismaModel.balanceType,
            amount: prismaModel.amount,
            balanceAfter: prismaModel.balanceAfter,
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
    toPrisma(domain: WalletTransaction): any {
        return {
            userId: domain.userId,
            currency: domain.currency,
            type: domain.type,
            balanceType: domain.balanceType,
            amount: domain.amount,
            balanceAfter: domain.balanceAfter,
            referenceId: domain.referenceId,
            metadata: domain.metadata as any,
            ipAddress: domain.ipAddress,
            countryCode: domain.countryCode,
            createdAt: domain.createdAt,
        };
    }
}
