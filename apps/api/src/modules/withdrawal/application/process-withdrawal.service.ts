import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WithdrawalProcessingMode } from '@repo/database';
import { NowPaymentApiService } from 'src/modules/payment/infrastructure/now-payment-api.service';
import { WithdrawalDetail, WithdrawalProcessingException } from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

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
    ) { }

    @Transactional()
    async execute(params: ProcessWithdrawalParams): Promise<ProcessWithdrawalResult> {
        const { withdrawalId } = params;

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

            // TODO: 잔액 복원 필요

            // 외부 에러를 도메인 에러로 래핑
            throw new WithdrawalProcessingException(withdrawalId, errorMessage);
        }
    }

    private async processAutoWithdrawal(
        withdrawal: WithdrawalDetail,
    ): Promise<ProcessWithdrawalResult> {
        const config = withdrawal.props.appliedConfig as Record<string, unknown>;
        const network = withdrawal.props.network ?? (config.network as string);

        // NowPayment 페이아웃 생성
        // TODO: 실제 연동 시 currency 매핑 필요
        const payoutResult = await this.nowPaymentApiService.createPayout({
            address: withdrawal.props.walletAddress!,
            addressExtraId: withdrawal.props.walletAddressExtraId ?? undefined,
            fiat_amount: Number(withdrawal.requestedAmount),
            fiat_currency: withdrawal.currency,
            crypto_currency: withdrawal.currency, // TODO: 적절한 매핑 필요
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
}
