import { Injectable, Inject } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, WithdrawalProcessingMode } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { FindUserWalletService } from 'src/modules/wallet/application/find-user-wallet.service';
import { UpdateOperation } from 'src/modules/wallet/domain';
import { WalletBalanceType, WalletTransactionType } from '@prisma/client';
import { WAGERING_REQUIREMENT_REPOSITORY } from 'src/modules/wagering/ports';
import type { WageringRequirementRepositoryPort } from 'src/modules/wagering/ports';
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
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly wageringRepository: WageringRequirementRepositoryPort,
        private readonly policy: WithdrawalPolicy,
        private readonly snowflakeService: SnowflakeService,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly findUserWalletService: FindUserWalletService,
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

        // 0. 락 획득 (동일 유저의 동시 출금 요청 방지)
        await this.repository.acquireUserLock(userId);

        // 1. 진행 중인 출금 요청 확인 (1개만 진행 가능)
        const hasPending = await this.repository.hasPendingWithdrawal(userId);
        this.policy.validateNoPendingWithdrawal(userId, hasPending);

        // 2. Config 조회 (symbol + network)
        const config = await this.repository.getCryptoConfigBySymbolAndNetwork(symbol, network);

        // 3. 금액 검증
        this.policy.validateCryptoAmount(requestedAmount, config);

        // 4. 롤링 조건 검증 (활성 WageringRequirement 없어야 함)
        const activeWageringRequirements = await this.wageringRepository.findActiveByUserIdAndCurrency(userId, currency);
        if (activeWageringRequirements.length > 0) {
            throw new WageringNotCompletedException(userId);
        }

        // 5. 잔액 검증
        const wallet = await this.findUserWalletService.findWallet(userId, currency, false);
        if (wallet) {
            this.policy.validateBalance(requestedAmount, {
                mainBalance: wallet.cash,
                bonusBalance: wallet.bonus,
            });
        }

        // 6. 수수료 계산
        const { feeAmount, netAmount } = this.policy.calculateFee(requestedAmount, config);

        // 7. 처리 모드 결정 (AUTO/MANUAL)
        const processingMode = this.policy.determineCryptoProcessingMode(requestedAmount, config);

        // 8. WithdrawalDetail 생성
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

        // 9. 수동 검토가 필요하면 상태 전이
        if (processingMode === WithdrawalProcessingMode.MANUAL) {
            withdrawal.markPendingReview();
        }

        // 10. 잔액 차감 (mainBalance에서 차감) - 저장 전에 먼저 차감
        await this.updateUserBalanceService.updateBalance({
            userId,
            currency,
            amount: requestedAmount,
            operation: UpdateOperation.SUBTRACT,
            balanceType: WalletBalanceType.CASH,
            transactionType: WalletTransactionType.WITHDRAW,
        });

        // 11. 출금 요청 저장
        const saved = await this.repository.create(withdrawal);

        // 12. 트랜잭션 기록은 UpdateUserBalanceService.updateBalance 내에서 WalletTransaction으로 처리됨
        // 기존의 common Transaction(TransactionType.WITHDRAW) 기록이 필요하다면 별도로 추가해야 함

        // Note: AUTO 모드 자동 처리는 별도 스케줄러/웹훅에서 처리

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
