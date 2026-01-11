import { Injectable, Inject } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { CreateWalletTransactionService } from 'src/modules/wallet/application/create-wallet-transaction.service';
import { WalletQueryService } from 'src/modules/wallet/application/wallet-query.service';
import { BalanceType, UpdateOperation } from 'src/modules/wallet/domain';
import { TransactionType, TransactionStatus } from '@repo/database';
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
        private readonly createWalletTransactionService: CreateWalletTransactionService,
        private readonly walletQueryService: WalletQueryService,
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
        const wallet = await this.walletQueryService.getWallet(userId, currency, false);
        if (wallet) {
            this.policy.validateBalance(requestedAmount, {
                mainBalance: wallet.mainBalance,
                bonusBalance: wallet.bonusBalance,
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
        const balanceResult = await this.updateUserBalanceService.execute({
            userId,
            currency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.SUBTRACT,
            amount: requestedAmount,
        });

        // 10. 출금 요청 저장
        const saved = await this.repository.create(withdrawal);

        // 11. 트랜잭션 기록 생성
        await this.createWalletTransactionService.execute({
            userId,
            type: TransactionType.WITHDRAW,
            status: TransactionStatus.PENDING,
            currency,
            amount: requestedAmount,
            beforeBalance: balanceResult.beforeMainBalance.add(balanceResult.beforeBonusBalance),
            afterBalance: balanceResult.afterMainBalance.add(balanceResult.afterBonusBalance),
            balanceDetail: {
                mainBalanceChange: balanceResult.mainBalanceChange,
                mainBeforeAmount: balanceResult.beforeMainBalance,
                mainAfterAmount: balanceResult.afterMainBalance,
                bonusBalanceChange: balanceResult.bonusBalanceChange,
                bonusBeforeAmount: balanceResult.beforeBonusBalance,
                bonusAfterAmount: balanceResult.afterBonusBalance,
            },
            description: 'Bank withdrawal request',
            metadata: {
                withdrawalId: saved.id.toString(),
                withdrawalType: 'BANK',
                bankName
            },
        });

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
