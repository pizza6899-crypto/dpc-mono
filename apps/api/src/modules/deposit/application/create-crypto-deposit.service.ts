// src/modules/deposit/application/create-crypto-deposit.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Prisma, DepositMethodType, ExchangeCurrencyCode, PaymentProvider } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import {
    DEPOSIT_DETAIL_REPOSITORY,
    CRYPTO_CONFIG_REPOSITORY,
} from '../ports/out';
import type {
    DepositDetailRepositoryPort,
    CryptoConfigRepositoryPort,
} from '../ports/out';
import {
    DepositDetail,
    DepositMethod,
    DepositAmount,
    PendingDepositExistsException,
    InvalidPromotionSelectionException,
    UnavailableCryptoConfigException,
} from '../domain';
import { CheckEligiblePromotionsService } from '../../promotion/application/check-eligible-promotions.service';
import { PROMOTION_REPOSITORY } from '../../promotion/ports/out';
import type { PromotionRepositoryPort } from '../../promotion/ports/out/promotion.repository.port';
import { Transactional } from '@nestjs-cls/transactional';

interface CreateCryptoDepositParams {
    userId: bigint;
    payCurrency: string;
    payNetwork: string;
    amount?: string | number;
    depositPromotionCode?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
}

@Injectable()
export class CreateCryptoDepositService {
    constructor(
        @Inject(DEPOSIT_DETAIL_REPOSITORY)
        private readonly depositRepository: DepositDetailRepositoryPort,
        @Inject(CRYPTO_CONFIG_REPOSITORY)
        private readonly cryptoConfigRepository: CryptoConfigRepositoryPort,
        @Inject(PROMOTION_REPOSITORY)
        private readonly promotionRepository: PromotionRepositoryPort,
        private readonly checkEligiblePromotionsService: CheckEligiblePromotionsService,
    ) { }

    @Transactional()
    async execute(params: CreateCryptoDepositParams): Promise<DepositDetail> {
        const {
            userId,
            payCurrency,
            payNetwork,
            amount,
            depositPromotionCode,
            ipAddress,
            deviceFingerprint,
        } = params;

        // 락 획득 (DB Advisory Lock)
        await this.depositRepository.acquireUserLock(userId);

        // 0. 중복 입금 신청 확인 (Pending 상태인 입금이 있으면 차단)
        const hasPendingDeposit = await this.depositRepository.existsPendingByUserId(userId);
        if (hasPendingDeposit) {
            throw new PendingDepositExistsException(userId);
        }

        let promotionId: bigint | null = null;

        // 1. 프로모션 유효성 검사
        if (depositPromotionCode) {
            // 코드로 프로모션 조회
            const promotion = await this.promotionRepository.findByCode(depositPromotionCode);
            if (!promotion) {
                throw new InvalidPromotionSelectionException(depositPromotionCode);
            }

            const eligiblePromotions = await this.checkEligiblePromotionsService.execute({
                userId,
                depositAmount: amount ? new Prisma.Decimal(amount) : new Prisma.Decimal(0),
                currency: payCurrency as ExchangeCurrencyCode,
            });

            const isEligible = eligiblePromotions.some((p) => p.code === depositPromotionCode);
            if (!isEligible) {
                throw new InvalidPromotionSelectionException(depositPromotionCode);
            }
            promotionId = promotion.id;
        }

        // 2. 암호화폐 설정 조회 및 검증
        const cryptoConfig = await this.cryptoConfigRepository.findBySymbolAndNetwork(
            payCurrency,
            payNetwork,
        );

        if (!cryptoConfig || !cryptoConfig.isActive) {
            throw new UnavailableCryptoConfigException(payCurrency, payNetwork);
        }

        // TODO: 주소 생성 로직 (Wallet Module 연동 필요)
        const walletAddress: string | undefined = undefined;

        // 2. DepositMethod 생성
        const depositMethod = DepositMethod.create(
            DepositMethodType.CRYPTO_WALLET,
            PaymentProvider.MANUAL,
        );

        // 3. DepositAmount 생성
        const depositAmount = DepositAmount.create({
            requestedAmount: amount ? new Prisma.Decimal(amount) : new Prisma.Decimal(0),
        });

        // 4. DepositDetail 생성
        const uid = createId();
        const depositDetail = DepositDetail.create({
            uid,
            userId,
            depositCurrency: payCurrency as ExchangeCurrencyCode,
            method: depositMethod,
            amount: depositAmount,
            cryptoConfigId: cryptoConfig.id,
            promotionId,
            walletAddress,
            depositNetwork: payNetwork,
            ipAddress,
            deviceFingerprint
        });

        // 5. 저장 및 반환
        return await this.depositRepository.create(depositDetail);
    }
}
