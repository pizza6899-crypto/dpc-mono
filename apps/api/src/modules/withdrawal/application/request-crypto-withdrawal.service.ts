import { Injectable, Inject } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, WithdrawalProcessingMode } from '@repo/database';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import {
    WithdrawalDetail,
    WithdrawalPolicy,
    WageringNotCompletedException,
} from '../domain';
import { WITHDRAWAL_REPOSITORY } from '../ports';
import type { WithdrawalRepositoryPort } from '../ports';

export interface RequestCryptoWithdrawalParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: string | number;
    symbol: string;
    network: string;
    walletAddress: string;
    walletAddressExtraId?: string | null;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
}

export interface RequestCryptoWithdrawalResult {
    withdrawalId: bigint;
    status: string;
    processingMode: string;
    requestedAmount: string;
    feeAmount: string | null;
    netAmount: string;
}

@Injectable()
export class RequestCryptoWithdrawalService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
        private readonly policy: WithdrawalPolicy,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    @Transactional()
    async execute(params: RequestCryptoWithdrawalParams): Promise<RequestCryptoWithdrawalResult> {
        const {
            userId,
            currency,
            amount,
            symbol,
            network,
            walletAddress,
            walletAddressExtraId,
            ipAddress,
            deviceFingerprint,
        } = params;

        const requestedAmount = new Prisma.Decimal(amount);

        // 1. Config 조회 (symbol + network)
        const config = await this.repository.getCryptoConfigBySymbolAndNetwork(symbol, network);

        // 2. 금액 검증
        this.policy.validateCryptoAmount(requestedAmount, config);

        // 3. 롤링 조건 검증 (활성 WageringRequirement 없어야 함)
        // TODO: WageringRepository 연동 필요
        // const hasActiveWagering = await this.wageringRepository.hasActiveByUserId(userId, currency);
        // if (hasActiveWagering) {
        //     throw new WageringNotCompletedException(userId);
        // }

        // 4. 잔액 검증
        // TODO: BalanceService 연동 필요
        // const balance = await this.balanceService.getBalance(userId, currency);
        // this.policy.validateBalance(requestedAmount, balance);

        // 5. 수수료 계산
        const { feeAmount, netAmount } = this.policy.calculateFee(requestedAmount, config);

        // 6. 처리 모드 결정 (AUTO/MANUAL)
        const processingMode = this.policy.determineCryptoProcessingMode(requestedAmount, config);

        // 7. WithdrawalDetail 생성
        const withdrawal = WithdrawalDetail.createCrypto({
            snowflakeService: this.snowflakeService,
            userId,
            currency,
            requestedAmount,
            network,
            walletAddress,
            walletAddressExtraId,
            processingMode,
            appliedConfig: config.toSnapshot(),
            cryptoWithdrawConfigId: config.id,
            ipAddress,
            deviceFingerprint,
            feeAmount,
            netAmount,
        });

        // 8. 수동 검토가 필요하면 상태 전이
        if (processingMode === WithdrawalProcessingMode.MANUAL) {
            withdrawal.markPendingReview();
        }

        // 9. 저장
        const saved = await this.repository.create(withdrawal);

        // 10. TODO: 잔액 차감 (BalanceService)
        // await this.balanceService.deductBalance(userId, currency, requestedAmount);

        // 11. TODO: 자동 처리 시작 (AUTO 모드인 경우)
        // if (processingMode === WithdrawalProcessingMode.AUTO) {
        //     await this.processWithdrawalService.execute(saved.id);
        // }

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
