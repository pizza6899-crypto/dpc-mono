// src/modules/deposit/application/create-bank-deposit.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Prisma, DepositMethodType, ExchangeCurrencyCode, PaymentProvider } from '@repo/database';
import { createId } from '@paralleldrive/cuid2';
import {
    DEPOSIT_DETAIL_REPOSITORY,
    BANK_CONFIG_REPOSITORY,
} from '../ports/out';
import type {
    DepositDetailRepositoryPort,
    BankConfigRepositoryPort,
} from '../ports/out';
import {
    DepositDetail,
    DepositMethod,
    DepositAmount,
    PendingDepositExistsException,
    InvalidPromotionSelectionException,
    NoActiveBankConfigException,
    InvalidDepositAmountException,
    BankConfig,
} from '../domain';
import { CheckEligiblePromotionsService } from '../../promotion/application/check-eligible-promotions.service';
import { Transactional } from '@nestjs-cls/transactional';

interface CreateBankDepositParams {
    userId: bigint;
    payCurrency: string;
    amount: string | number;
    depositorName?: string;
    depositPromotionId?: string | number;
    ipAddress?: string;
    deviceFingerprint?: string;
}

interface CreateBankDepositResult {
    deposit: DepositDetail;
    selectedBank: BankConfig;
}

@Injectable()
export class CreateBankDepositService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
        @Inject(BANK_CONFIG_REPOSITORY)
        private readonly bankConfigRepository: BankConfigRepositoryPort,
        private readonly promotionsService: CheckEligiblePromotionsService,
    ) { }

    @Transactional()
    async execute(params: CreateBankDepositParams): Promise<CreateBankDepositResult> {
        const {
            userId,
            payCurrency,
            amount,
            depositPromotionId,
            depositorName,
            ipAddress,
            deviceFingerprint,
        } = params;

        // 락 획득 (DB Advisory Lock)
        await this.depositRepository.acquireUserLock(userId);

        // 0. 중복 입금 신청 확인
        const hasPendingDeposit = await this.depositRepository.existsPendingByUserId(userId);
        if (hasPendingDeposit) {
            throw new PendingDepositExistsException(userId);
        }

        // 1. 프로모션 유효성 검사
        if (depositPromotionId) {
            const eligiblePromotions = await this.promotionsService.execute({
                userId,
                depositAmount: new Prisma.Decimal(amount),
                currency: payCurrency as ExchangeCurrencyCode,
            });

            const isEligible = eligiblePromotions.some((p) => Number(p.id) === Number(depositPromotionId));
            if (!isEligible) {
                throw new InvalidPromotionSelectionException(depositPromotionId);
            }
        }

        // 2. 활성화된 은행 계좌 조회
        const activeBanks = await this.bankConfigRepository.listActive(payCurrency as ExchangeCurrencyCode);

        if (activeBanks.length === 0) {
            throw new NoActiveBankConfigException(payCurrency);
        }

        // 로드 밸런싱/우선순위 로직 (여기선 단순 첫 번째 선택)
        const selectedBank = activeBanks[0];
        const decimalAmount = new Prisma.Decimal(amount);

        if (!selectedBank.isAmountValid(decimalAmount)) {
            throw new InvalidDepositAmountException(
                amount,
                `Must be between ${selectedBank.minAmount} and ${selectedBank.maxAmount ?? 'unlimited'}`,
            );
        }

        // 2. DepositMethod 생성
        const depositMethod = DepositMethod.create(
            DepositMethodType.BANK_TRANSFER,
            PaymentProvider.MANUAL,
        );

        // 3. DepositAmount 생성
        const depositAmount = DepositAmount.create({
            requestedAmount: decimalAmount,
        });

        // 4. DepositDetail 생성
        const uid = createId();
        const depositDetail = DepositDetail.create({
            uid,
            userId,
            depositCurrency: payCurrency as ExchangeCurrencyCode,
            method: depositMethod,
            amount: depositAmount,
            bankConfigId: selectedBank.id!,
            promotionId: depositPromotionId ? BigInt(depositPromotionId) : null,
            depositorName,
            ipAddress,
            deviceFingerprint
        });

        // 5. 저장
        const savedDeposit = await this.depositRepository.create(depositDetail);

        // 6. 도메인 엔티티 반환
        return {
            deposit: savedDeposit,
            selectedBank,
        };
    }
}
