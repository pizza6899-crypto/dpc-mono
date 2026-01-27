import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, UserWalletTransactionType, UserWalletBalanceType } from '@prisma/client';
import { UpdateUserBalanceService } from './update-user-balance.service';
import { UserWallet, UpdateOperation, WalletActionName, InvalidWalletBalanceException } from '../domain';
import { Prisma } from '@prisma/client';

export enum VaultOperation {
    DEPOSIT = 'DEPOSIT',   // Cash -> Vault
    WITHDRAW = 'WITHDRAW', // Vault -> Cash
}

export interface ProcessVaultOperationParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    operation: VaultOperation;
}

/**
 * 금고 관리 서비스 (User Use Case)
 * 
 * 사용자가 자신의 가용 자산을 금고로 옮기거나 다시 꺼내는 기능을 처리합니다.
 * UpdateUserBalanceService를 사용하여 통계(Stats) 및 트랜잭션 정합성을 유지합니다.
 */
@Injectable()
export class ProcessVaultOperationService {
    constructor(
        private readonly userBalanceService: UpdateUserBalanceService,
    ) { }

    @Transactional()
    async execute({ userId, currency, amount, operation }: ProcessVaultOperationParams): Promise<UserWallet> {
        if (amount.isNegative() || amount.isZero()) {
            throw new InvalidWalletBalanceException('Amount must be positive');
        }

        const isDeposit = operation === VaultOperation.DEPOSIT;
        const transactionType = isDeposit
            ? UserWalletTransactionType.VAULT_IN
            : UserWalletTransactionType.VAULT_OUT;

        const actionName = WalletActionName.VAULT_OPERATION;
        const metadata = {
            operation,
            description: `Vault ${operation.toLowerCase()}`,
        };

        // 1. Source Balance Processing (돈이 나가는 쪽)
        await this.userBalanceService.updateBalance({
            userId,
            currency,
            amount,
            operation: UpdateOperation.SUBTRACT,
            balanceType: isDeposit ? UserWalletBalanceType.CASH : UserWalletBalanceType.VAULT,
            transactionType,
        }, {
            actionName,
            metadata: {
                ...metadata,
                description: `${metadata.description} (Source)`,
            },
        });

        // 2. Destination Balance Processing (돈이 들어오는 쪽)
        return this.userBalanceService.updateBalance({
            userId,
            currency,
            amount,
            operation: UpdateOperation.ADD,
            balanceType: isDeposit ? UserWalletBalanceType.VAULT : UserWalletBalanceType.CASH,
            transactionType,
        }, {
            actionName,
            metadata: {
                ...metadata,
                description: `${metadata.description} (Destination)`,
            },
        });
    }
}
