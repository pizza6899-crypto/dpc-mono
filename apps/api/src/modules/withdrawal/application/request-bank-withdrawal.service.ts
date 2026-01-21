import { Injectable, Inject } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { FindUserWalletService } from 'src/modules/wallet/application/find-user-wallet.service';
import { UpdateOperation } from 'src/modules/wallet/domain';
import { WalletBalanceType, WalletTransactionType } from '@prisma/client';
import { WithdrawalDetail, WithdrawalPolicy } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface RequestBankWithdrawalParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: string | number;
    bankConfigId: bigint;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
}

export interface RequestBankWithdrawalResult {
    withdrawalId: bigint;
    status: string;
    processingMode: string;
    requestedAmount: string;
    feeAmount: string | null;
    netAmount: string;
}

@Injectable()
export class RequestBankWithdrawalService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
        private readonly policy: WithdrawalPolicy,
        private readonly snowflakeService: SnowflakeService,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly findUserWalletService: FindUserWalletService,
    ) { }

    @Transactional()
    async execute(params: RequestBankWithdrawalParams): Promise<RequestBankWithdrawalResult> {
        const {
            userId,
            currency,
            amount,
            bankConfigId,
            bankName,
            accountNumber,
            accountHolder,
            ipAddress,
            deviceFingerprint,
        } = params;

        const requestedAmount = new Prisma.Decimal(amount);

        // 0. 락 획득 (동일 유저의 동시 출금 요청 방지)
        await this.repository.acquireUserLock(userId);

        // 1. 진행 중인 출금 요청 확인 (1개만 진행 가능)
        const hasPending = await this.repository.hasPendingWithdrawal(userId);
        this.policy.validateNoPendingWithdrawal(userId, hasPending);

        // 2. Config 조회
        const config = await this.repository.getBankConfigById(bankConfigId);

        // 3. 금액 검증
        this.policy.validateBankAmount(requestedAmount, config);

        // 4. 잔액 검증
        const wallet = await this.findUserWalletService.findWallet(userId, currency, false);
        if (wallet) {
            this.policy.validateBalance(requestedAmount, {
                mainBalance: wallet.cash,
                bonusBalance: wallet.bonus,
            });
        }

        // 5. 수수료 계산
        const { feeAmount, netAmount } = this.policy.calculateFee(requestedAmount, config);

        // 6. 처리 모드 (은행 출금은 항상 MANUAL - 엔티티 내부에서 결정)

        // 7. WithdrawalDetail 생성
        const withdrawal = WithdrawalDetail.createBank({
            snowflakeService: this.snowflakeService,
            userId,
            currency,
            requestedAmount,
            bankName,
            accountNumber,
            accountHolder,
            appliedConfig: config.toSnapshot(),
            bankWithdrawConfigId: config.id,
            ipAddress,
            deviceFingerprint,
            feeAmount,
            netAmount,
        });

        // 8. 수동 검토 상태로 전이
        withdrawal.markPendingReview();

        // 9. 잔액 차감 (mainBalance에서 차감) - 저장 전에 먼저 차감
        await this.updateUserBalanceService.updateBalance({
            userId,
            currency,
            amount: requestedAmount,
            operation: UpdateOperation.SUBTRACT,
            balanceType: WalletBalanceType.CASH,
            transactionType: WalletTransactionType.WITHDRAW,
        });

        // 10. 출금 요청 저장
        const saved = await this.repository.create(withdrawal);

        // 11. 트랜잭션 기록은 UpdateUserBalanceService.updateBalance 내에서 WalletTransaction으로 처리됨
        // 기존의 common Transaction(TransactionType.WITHDRAW) 기록이 필요하다면 별도로 추가해야 함
        // 여기서는 WithdrawalDetail이 해당 정보를 담고 있고 WalletTransaction이 잔액 변동을 담고 있으므로 일단 생략하거나 
        // 필요시 WithdrawalRepository에 트랜잭션 생성 메서드를 추가해야 함

        return {
            withdrawalId: saved.id,
            status: saved.status,
            processingMode: saved.processingMode,
            requestedAmount: saved.requestedAmount.toString(),
            feeAmount: saved.props.feeAmount?.toString() ?? null,
            netAmount: saved.props.netAmount?.toString() ?? saved.requestedAmount.toString(),
        };
    }
}
