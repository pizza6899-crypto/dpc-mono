import { Injectable, Inject } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, WithdrawalProcessingMode } from '@repo/database';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
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

        // 1. Config 조회
        const config = await this.repository.getBankConfigById(bankConfigId);

        // 2. 금액 검증
        this.policy.validateBankAmount(requestedAmount, config);

        // 3. 롤링 조건 검증
        // TODO: WageringRepository 연동 필요

        // 4. 잔액 검증
        // TODO: BalanceService 연동 필요

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

        // 9. 저장
        const saved = await this.repository.create(withdrawal);

        // 10. TODO: 잔액 차감 (BalanceService)

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
