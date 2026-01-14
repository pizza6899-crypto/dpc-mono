import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode, Language } from '@repo/database';
import { PromotionPolicy } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import {
    Promotion,
    PromotionTranslation,
    PromotionCurrency,
} from '../domain';

interface VerifyPromotionCodeParams {
    userId: bigint;
    code: string;
    depositAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    language?: Language;
}

interface VerifyPromotionResult {
    isValid: boolean;
    message?: string;
    estimatedBonusAmount?: Prisma.Decimal;
    promotion?: Promotion;
    translation?: PromotionTranslation;
    currencySetting?: PromotionCurrency;
}

@Injectable()
export class VerifyPromotionCodeService {
    constructor(
        @Inject(PROMOTION_REPOSITORY)
        private readonly repository: PromotionRepositoryPort,
        private readonly policy: PromotionPolicy,
    ) { }

    async execute({
        userId,
        code,
        depositAmount,
        currency,
        language = Language.EN,
    }: VerifyPromotionCodeParams): Promise<VerifyPromotionResult> {
        // 1. 프로모션 조회
        const promotion = await this.repository.findByCode(code);
        if (!promotion) {
            return {
                isValid: false,
                message: 'Invalid promotion code',
            };
        }

        // 2. 통화별 설정 확인
        const currencySettings = promotion.getCurrency(currency);
        if (!currencySettings) {
            return {
                isValid: false,
                message: `Promotion not available for currency ${currency}`,
            };
        }

        // 3. 번역 정보 확인 (응답용)
        const translation =
            promotion.getTranslation(language) || promotion.getTranslation(Language.EN);

        try {
            // 4. 사용자 상태 확인
            const [hasPreviousDeposits, hasWithdrawn, existingUserPromotion] =
                await Promise.all([
                    this.repository.hasPreviousDeposits(userId),
                    this.repository.hasWithdrawn(userId),
                    this.repository.findUserPromotion(userId, promotion.id),
                ]);

            // 5. 정책 검증 (예외 발생 시 catch로 이동)
            this.policy.validateEligibility(
                promotion,
                depositAmount,
                currencySettings,
                existingUserPromotion,
                hasPreviousDeposits,
                hasWithdrawn,
            );

            // 6. 보너스 계산
            const estimatedBonusAmount = promotion.calculateBonus(
                depositAmount,
                currencySettings.maxBonusAmount,
            );

            return {
                isValid: true,
                estimatedBonusAmount,
                promotion,
                translation: translation ?? undefined,
                currencySetting: currencySettings,
            };
        } catch (error: any) {
            return {
                isValid: false,
                message: error.message || 'Promotion validation failed',
            };
        }
    }
}
