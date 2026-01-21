import { Injectable } from '@nestjs/common';
import { CompWallet, CompTransaction } from '../domain';
import { UserCompWallet, CompWalletTransaction } from '@prisma/client';

@Injectable()
export class CompMapper {
    toDomain(model: UserCompWallet): CompWallet {
        return CompWallet.rehydrate({
            id: model.id,
            userId: model.userId,
            currency: model.currency,
            balance: model.balance,
            totalEarned: model.totalEarned,
            totalUsed: model.totalUsed,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }

    toPersistence(entity: CompWallet): Partial<UserCompWallet> {
        return {
            id: entity.id === BigInt(0) ? undefined : entity.id,
            userId: entity.userId,
            currency: entity.currency,
            balance: entity.balance,
            totalEarned: entity.totalEarned,
            totalUsed: entity.totalUsed,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    toTransactionDomain(model: CompWalletTransaction): CompTransaction {
        return CompTransaction.rehydrate({
            id: model.id,
            compWalletId: model.compWalletId,
            amount: model.amount,
            balanceAfter: model.balanceAfter,
            type: model.type,
            referenceId: model.referenceId,
            description: model.description,
            createdAt: model.createdAt,
        });
    }

    toTransactionPersistence(entity: CompTransaction): Partial<CompWalletTransaction> {
        return {
            id: entity.id === BigInt(0) ? undefined : entity.id,
            compWalletId: entity.compWalletId,
            amount: entity.amount,
            balanceAfter: entity.balanceAfter,
            type: entity.type,
            referenceId: entity.referenceId,
            description: entity.description,
            createdAt: entity.createdAt,
        };
    }
}
