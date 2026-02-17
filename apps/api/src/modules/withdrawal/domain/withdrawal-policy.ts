import { Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, WithdrawalProcessingMode } from '@prisma/client';
import { CryptoWithdrawConfig } from './model/crypto-withdraw-config.entity';
import { BankWithdrawConfig } from './model/bank-withdraw-config.entity';
import {
    WithdrawalAmountBelowMinimumException,
    WithdrawalAmountExceedsMaximumException,
    InsufficientBalanceException,
    PendingWithdrawalExistsException,
} from './withdrawal.exception';

interface BalanceInfo {
    mainBalance: Prisma.Decimal;
    bonusBalance: Prisma.Decimal;
}

@Injectable()
export class WithdrawalPolicy {
    /**
     * 잔액 검증
     * - mainBalance + bonusBalance >= requestedAmount
     */
    validateBalance(
        requestedAmount: Prisma.Decimal,
        balance: BalanceInfo,
    ): void {
        const totalBalance = balance.mainBalance.add(balance.bonusBalance);
        if (totalBalance.lt(requestedAmount)) {
            throw new InsufficientBalanceException(
                requestedAmount.toString(),
                totalBalance.toString(),
            );
        }
    }

    /**
     * 암호화폐 출금 금액 검증
     */
    validateCryptoAmount(
        requestedAmount: Prisma.Decimal,
        config: CryptoWithdrawConfig,
    ): void {
        const result = config.validateAmount(requestedAmount);
        if (!result.valid) {
            if (result.reason?.includes('Minimum')) {
                throw new WithdrawalAmountBelowMinimumException(
                    requestedAmount.toString(),
                    config.minWithdrawAmount.toString(),
                );
            }
            if (result.reason?.includes('Maximum')) {
                throw new WithdrawalAmountExceedsMaximumException(
                    requestedAmount.toString(),
                    config.maxWithdrawAmount!.toString(),
                );
            }
        }
    }

    /**
     * 은행 출금 금액 검증
     */
    validateBankAmount(
        requestedAmount: Prisma.Decimal,
        config: BankWithdrawConfig,
    ): void {
        const result = config.validateAmount(requestedAmount);
        if (!result.valid) {
            if (result.reason?.includes('Minimum')) {
                throw new WithdrawalAmountBelowMinimumException(
                    requestedAmount.toString(),
                    config.minWithdrawAmount.toString(),
                );
            }
            if (result.reason?.includes('Maximum')) {
                throw new WithdrawalAmountExceedsMaximumException(
                    requestedAmount.toString(),
                    config.maxWithdrawAmount!.toString(),
                );
            }
        }
    }

    /**
     * 암호화폐 출금 처리 모드 결정
     * - autoProcessLimit 이하: AUTO
     * - autoProcessLimit 초과: MANUAL (관리자 검토 필요)
     */
    determineCryptoProcessingMode(
        requestedAmount: Prisma.Decimal,
        config: CryptoWithdrawConfig,
    ): WithdrawalProcessingMode {
        if (config.canAutoProcess(requestedAmount)) {
            return WithdrawalProcessingMode.AUTO;
        }
        return WithdrawalProcessingMode.MANUAL;
    }

    /**
     * 수수료 계산
     */
    calculateFee(
        requestedAmount: Prisma.Decimal,
        config: CryptoWithdrawConfig | BankWithdrawConfig,
    ): { feeAmount: Prisma.Decimal; netAmount: Prisma.Decimal } {
        const feeAmount = config.calculateFee(requestedAmount);
        const netAmount = requestedAmount.sub(feeAmount);
        return { feeAmount, netAmount };
    }

    /**
     * 진행 중인 출금 요청 없음 검증
     * - 이미 진행 중인 출금 요청(PENDING, PENDING_REVIEW, PROCESSING, SENDING)이 있으면 예외 발생
     */
    validateNoPendingWithdrawal(userId: bigint, hasPending: boolean): void {
        if (hasPending) {
            throw new PendingWithdrawalExistsException();
        }
    }
}
