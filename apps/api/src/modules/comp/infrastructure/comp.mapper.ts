import { Injectable } from '@nestjs/common';
import { CompWallet, CompTransaction } from '../domain';
import { UserCompWallet, CompWalletTransaction } from '@repo/database';

@Injectable()
export class CompMapper {
    toDomain(model: UserCompWallet): CompWallet {
        return new CompWallet(
            model.id,
            model.userId,
            model.currency,
            model.balance,
            model.totalEarned,
            model.totalUsed,
            model.createdAt,
            model.updatedAt,
        );
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
        return new CompTransaction(
            model.id,
            model.compWalletId,
            model.amount,
            model.balanceAfter,
            model.type,
            model.referenceId,
            model.description,
            model.createdAt,
        );
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
