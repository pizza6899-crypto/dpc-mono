import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WithdrawalProcessingMode } from '@prisma/client';
import { NowPaymentApiService } from 'src/modules/payment/infrastructure/now-payment-api.service';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { WithdrawalDetail, WithdrawalProcessingException } from '../domain';
import { UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';
import { WithdrawalMetadata } from 'src/modules/wallet/domain/model/user-wallet-transaction-metadata';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export interface ProcessWithdrawalParams {
    withdrawalId: bigint;
}

export interface ProcessWithdrawalResult {
    withdrawalId: bigint;
    status: string;
    providerWithdrawalId?: string;
    transactionHash?: string;
}

@Injectable()
export class ProcessWithdrawalService {
    private readonly logger = new Logger(ProcessWithdrawalService.name);

    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
        private readonly nowPaymentApiService: NowPaymentApiService,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(params: ProcessWithdrawalParams): Promise<ProcessWithdrawalResult> {
        const { withdrawalId } = params;

        // 0. 락 획득 (출금 건별 동시 처리 방지)
        await this.advisoryLockService.acquireLock(LockNamespace.WITHDRAWAL, withdrawalId.toString(), {
            throwThrottleError: true,
        });

        // 1. 출금 조회
        const withdrawal = await this.repository.getById(withdrawalId);

        // 2. 처리 가능 상태 확인
        if (!withdrawal.isProcessing && !withdrawal.isPending) {
            this.logger.warn(`Withdrawal ${withdrawalId} is not in processable state: ${withdrawal.status}`);
            return {
                withdrawalId: withdrawal.id,
                status: withdrawal.status,
            };
        }

        // 3. 처리 중 상태로 전환
        if (!withdrawal.isProcessing) {
            withdrawal.markProcessing();
            await this.repository.save(withdrawal);
        }

        try {
            // 4. AUTO 모드인 경우 NowPayment API 호출
            if (withdrawal.processingMode === WithdrawalProcessingMode.AUTO) {
                return await this.processAutoWithdrawal(withdrawal);
            }

            // MANUAL 모드는 관리자가 직접 처리
            return {
                withdrawalId: withdrawal.id,
                status: withdrawal.status,
            };
        } catch (error) {
            this.logger.error(`Failed to process withdrawal ${withdrawalId}`, error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // 실패 처리
            withdrawal.fail(errorMessage);
            await this.repository.save(withdrawal);

            // 잔액 복원
            await this.restoreBalance(withdrawal);

            // 외부 에러를 도메인 에러로 래핑
            throw new WithdrawalProcessingException(errorMessage);
        }
    }

    private async processAutoWithdrawal(
        withdrawal: WithdrawalDetail,
    ): Promise<ProcessWithdrawalResult> {
        const config = withdrawal.props.appliedConfig as Record<string, unknown>;
        const network = withdrawal.props.network ?? (config.network as string);

        // NowPayment 페이아웃 생성
        const payoutResult = await this.nowPaymentApiService.createPayout({
            address: withdrawal.props.walletAddress!,
            addressExtraId: withdrawal.props.walletAddressExtraId ?? undefined,
            fiat_amount: Number(withdrawal.requestedAmount),
            fiat_currency: withdrawal.currency,
            crypto_currency: (config.symbol as string) ?? withdrawal.currency,
        });

        const payoutWithdrawal = payoutResult.withdrawals[0];

        // 전송 중 상태로 전환
        withdrawal.markSending(payoutResult.id);
        withdrawal.updateProviderMetadata({
            payoutId: payoutResult.id,
            payoutWithdrawalId: payoutWithdrawal?.id,
            batch_withdrawal_id: payoutWithdrawal?.batch_withdrawal_id,
        });
        await this.repository.save(withdrawal);

        // 페이아웃 인증 (필요한 경우)
        try {
            await this.nowPaymentApiService.verifyPayout(payoutResult.id);
        } catch (error) {
            this.logger.warn(`Failed to verify payout ${payoutResult.id}`, error);
            // 인증 실패해도 일단 진행 (콜백으로 처리됨)
        }

        return {
            withdrawalId: withdrawal.id,
            status: withdrawal.status,
            providerWithdrawalId: payoutResult.id,
        };
    }

    /**
     * 실패/취소 시 잔액 복원
     */
    private async restoreBalance(withdrawal: WithdrawalDetail): Promise<void> {
        try {
            await this.updateUserBalanceService.updateBalance({
                userId: withdrawal.userId,
                currency: withdrawal.currency,
                amount: withdrawal.requestedAmount,
                operation: UpdateOperation.ADD,
                balanceType: UserWalletBalanceType.CASH,
                transactionType: UserWalletTransactionType.REFUND,
                referenceId: withdrawal.id,
            }, {
                internalNote: 'Withdrawal processing failed - balance restored',
                actionName: WalletActionName.RESTORE_BALANCE_ON_FAILURE,
                metadata: {
                    withdrawalId: withdrawal.id.toString(),
                    reason: 'PROCESSING_FAILED'
                } as WithdrawalMetadata,
            });

            this.logger.log(
                `Restored balance for failed withdrawal ${withdrawal.id}: ${withdrawal.requestedAmount} ${withdrawal.currency}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to restore balance for withdrawal ${withdrawal.id}`,
                error instanceof Error ? error.stack : String(error),
            );
            // 잔액 복원 실패는 로깅하고 계속 진행 (수동 처리 필요)
        }
    }
}
