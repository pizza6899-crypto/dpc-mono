import { Injectable } from '@nestjs/common';
import { CompWallet, CompTransaction, CompConfig as DomainCompConfig, CompClaimHistory as DomainCompClaimHistory } from '../domain';
import { UserCompWallet, CompWalletTransaction, CompConfig, CompClaimHistory } from '@prisma/client';

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
            isFrozen: model.isFrozen,
            lastClaimedAt: model.lastClaimedAt,
            lastActiveAt: model.lastActiveAt,
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
            isFrozen: entity.isFrozen,
            lastClaimedAt: entity.lastClaimedAt,
            lastActiveAt: entity.lastActiveAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    toTransactionDomain(model: CompWalletTransaction): CompTransaction {
        return CompTransaction.rehydrate({
            id: model.id,
            compWalletId: model.compWalletId,
            amount: model.amount,
            balanceBefore: model.balanceBefore,
            balanceAfter: model.balanceAfter,
            appliedRate: model.appliedRate,
            type: model.type,
            referenceId: model.referenceId,
            processedBy: model.processedBy,
            description: model.description,
            createdAt: model.createdAt,
        });
    }

    toTransactionPersistence(entity: CompTransaction): Partial<CompWalletTransaction> {
        return {
            id: entity.id === BigInt(0) ? undefined : entity.id,
            compWalletId: entity.compWalletId,
            amount: entity.amount,
            balanceBefore: entity.balanceBefore,
            balanceAfter: entity.balanceAfter,
            appliedRate: entity.appliedRate,
            type: entity.type,
            referenceId: entity.referenceId,
            processedBy: entity.processedBy,
            description: entity.description,
            createdAt: entity.createdAt,
        };
    }

    toConfigDomain(model: CompConfig): DomainCompConfig {
        return DomainCompConfig.rehydrate({
            id: model.id,
            isEarnEnabled: model.isEarnEnabled,
            isClaimEnabled: model.isClaimEnabled,
            allowNegativeBalance: model.allowNegativeBalance,
            minClaimAmount: model.minClaimAmount,
            maxDailyEarnPerUser: model.maxDailyEarnPerUser,
            expirationDays: model.expirationDays,
            description: model.description,
            updatedAt: model.updatedAt,
        });
    }

    toConfigPersistence(entity: DomainCompConfig): Partial<CompConfig> {
        return {
            id: entity.id === BigInt(0) ? undefined : entity.id,
            isEarnEnabled: entity.isEarnEnabled,
            isClaimEnabled: entity.isClaimEnabled,
            allowNegativeBalance: entity.allowNegativeBalance,
            minClaimAmount: entity.minClaimAmount,
            maxDailyEarnPerUser: entity.maxDailyEarnPerUser,
            expirationDays: entity.expirationDays,
            description: entity.description,
            updatedAt: new Date(), // Always update timestamp
        };
    }

    toClaimHistoryDomain(model: CompClaimHistory): DomainCompClaimHistory {
        return DomainCompClaimHistory.rehydrate({
            id: model.id,
            userId: model.userId,
            status: model.status,
            failureReason: model.failureReason,
            compWalletTransactionId: model.compWalletTransactionId,
            compAmount: model.compAmount,
            compCurrency: model.compCurrency,
            walletTransactionId: model.walletTransactionId,
            targetAmount: model.targetAmount,
            targetCurrency: model.targetCurrency,
            exchangeRate: model.exchangeRate,
            claimedAt: model.claimedAt,
        });
    }

    toClaimHistoryPersistence(entity: DomainCompClaimHistory): Partial<CompClaimHistory> {
        return {
            id: entity.id === BigInt(0) ? undefined : entity.id,
            userId: entity.userId,
            status: entity.status,
            failureReason: entity.failureReason,
            compWalletTransactionId: entity.compWalletTransactionId,
            compAmount: entity.compAmount,
            compCurrency: entity.compCurrency,
            walletTransactionId: entity.walletTransactionId,
            targetAmount: entity.targetAmount,
            targetCurrency: entity.targetCurrency,
            exchangeRate: entity.exchangeRate,
            claimedAt: entity.claimedAt,
        };
    }
}
