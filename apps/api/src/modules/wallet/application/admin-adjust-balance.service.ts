import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, Prisma, WalletTransactionType, WalletBalanceType, AdjustmentReasonCode } from '@prisma/client';
import { UserBalanceService, UpdateOperation } from './user-balance.service';
import { UserWallet } from '../domain';

export interface AdminAdjustBalanceParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    operation: UpdateOperation;
    balanceType: WalletBalanceType;
    adminId: bigint;
    reasonCode: AdjustmentReasonCode;
    internalNote?: string;
}

/**
 * 관리자 잔액 조정 서비스 (Admin Use Case)
 * 
 * 관리자가 명시적으로 사용자의 잔액을 수동 조정할 때 사용합니다.
 * UserBalanceService를 내부적으로 활용하여 일관된 로직을 유지합니다.
 */
@Injectable()
export class AdminAdjustBalanceService {
    constructor(
        private readonly userBalanceService: UserBalanceService,
    ) { }

    @Transactional()
    async execute(params: AdminAdjustBalanceParams): Promise<UserWallet> {
        return this.userBalanceService.updateBalance(
            {
                userId: params.userId,
                currency: params.currency,
                amount: params.amount,
                operation: params.operation,
                balanceType: params.balanceType,
                transactionType: WalletTransactionType.ADJUSTMENT,
            },
            {
                adminUserId: params.adminId,
                reasonCode: params.reasonCode,
                internalNote: params.internalNote,
                actionName: 'ADMIN_MANUAL_ADJUSTMENT',
            },
        );
    }
}
