// src/modules/promotion/domain/promotion-policy.spec.ts
import {
    Prisma,
    PromotionTargetType,
    PromotionBonusType,
    PromotionQualification,
    ExchangeCurrencyCode,
    UserPromotionStatus,
} from '@repo/database';
import { PromotionPolicy } from './promotion-policy';
import { Promotion } from './model/promotion.entity';
import { PromotionCurrency } from './model/promotion-currency.entity';
import { UserPromotion } from './model/user-promotion.entity';
import {
    PromotionNotEligibleException,
    PromotionAlreadyUsedException,
    PromotionNotActiveException,
} from './promotion.exception';

describe('PromotionPolicy', () => {
    let policy: PromotionPolicy;

    beforeEach(() => {
        policy = new PromotionPolicy();
    });

    const createPromotion = (overrides: Partial<Parameters<typeof Promotion.fromPersistence>[0]> = {}) => {
        return Promotion.fromPersistence({
            id: BigInt(1),
            uid: 'promo-uid-123',
            managementName: 'Test Promotion',
            isActive: true,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
            bonusType: PromotionBonusType.PERCENTAGE,
            bonusRate: new Prisma.Decimal(0.1),
            rollingMultiplier: new Prisma.Decimal(5),
            qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
            isOneTime: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        });
    };

    const createCurrencySettings = (overrides: Partial<Parameters<typeof PromotionCurrency.fromPersistence>[0]> = {}) => {
        return PromotionCurrency.fromPersistence({
            id: 1,
            promotionId: 1,
            currency: ExchangeCurrencyCode.USDT,
            minDepositAmount: new Prisma.Decimal(10),
            maxBonusAmount: new Prisma.Decimal(100),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        });
    };

    const createUserPromotion = (overrides: Partial<Parameters<typeof UserPromotion.fromPersistence>[0]> = {}) => {
        return UserPromotion.fromPersistence({
            id: 1,
            userId: BigInt(100),
            promotionId: 1,
            status: UserPromotionStatus.ACTIVE,
            depositAmount: new Prisma.Decimal(100),
            bonusAmount: new Prisma.Decimal(10),
            targetRollingAmount: new Prisma.Decimal(50),
            currentRollingAmount: new Prisma.Decimal(0),
            currency: ExchangeCurrencyCode.USDT,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        });
    };

    describe('isPromotionActive', () => {
        it('should pass when promotion is active', () => {
            const promotion = createPromotion();
            const now = new Date('2024-06-15');

            expect(() => policy.isPromotionActive(promotion, now)).not.toThrow();
        });

        it('should throw when promotion is inactive', () => {
            const promotion = createPromotion({ isActive: false });

            expect(() => policy.isPromotionActive(promotion)).toThrow(
                PromotionNotActiveException,
            );
        });

        it('should throw when before start date', () => {
            const promotion = createPromotion({
                startDate: new Date('2024-06-01'),
            });
            const now = new Date('2024-05-15');

            expect(() => policy.isPromotionActive(promotion, now)).toThrow(
                PromotionNotActiveException,
            );
        });
    });

    describe('validateMinDepositAmount', () => {
        it('should pass when deposit meets minimum', () => {
            const currencySettings = createCurrencySettings({
                minDepositAmount: new Prisma.Decimal(10),
            });

            expect(() =>
                policy.validateMinDepositAmount(new Prisma.Decimal(50), currencySettings),
            ).not.toThrow();
        });

        it('should throw when deposit below minimum', () => {
            const currencySettings = createCurrencySettings({
                minDepositAmount: new Prisma.Decimal(100),
            });

            expect(() =>
                policy.validateMinDepositAmount(new Prisma.Decimal(50), currencySettings),
            ).toThrow(PromotionNotEligibleException);
        });
    });

    describe('validateOneTimePromotion', () => {
        it('should pass when one-time promotion not used', () => {
            const promotion = createPromotion({ isOneTime: true });

            expect(() =>
                policy.validateOneTimePromotion(promotion, null),
            ).not.toThrow();
        });

        it('should pass when non-one-time promotion with existing user promotion', () => {
            const promotion = createPromotion({ isOneTime: false });
            const userPromotion = createUserPromotion({ bonusAmount: new Prisma.Decimal(10) });

            expect(() =>
                policy.validateOneTimePromotion(promotion, userPromotion),
            ).not.toThrow();
        });

        it('should throw when one-time promotion already used', () => {
            const promotion = createPromotion({ isOneTime: true });
            const userPromotion = createUserPromotion({ bonusAmount: new Prisma.Decimal(10) });

            expect(() =>
                policy.validateOneTimePromotion(promotion, userPromotion),
            ).toThrow(PromotionAlreadyUsedException);
        });

        it('should pass when one-time promotion exists but bonus not granted', () => {
            const promotion = createPromotion({ isOneTime: true });
            const userPromotion = createUserPromotion({ bonusAmount: new Prisma.Decimal(0) });

            expect(() =>
                policy.validateOneTimePromotion(promotion, userPromotion),
            ).not.toThrow();
        });
    });

    describe('validateFirstDepositEligibility', () => {
        it('should pass for first deposit promotion with no previous deposits', () => {
            const promotion = createPromotion({
                targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
            });

            expect(() =>
                policy.validateFirstDepositEligibility(promotion, false),
            ).not.toThrow();
        });

        it('should throw for first deposit promotion with previous deposits', () => {
            const promotion = createPromotion({
                targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
            });

            expect(() =>
                policy.validateFirstDepositEligibility(promotion, true),
            ).toThrow(PromotionNotEligibleException);
        });


    });

    describe('validateUntilFirstWithdrawalEligibility', () => {
        it('should pass when no withdrawal made', () => {
            const promotion = createPromotion({
                qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
            });

            expect(() =>
                policy.validateUntilFirstWithdrawalEligibility(promotion, false),
            ).not.toThrow();
        });

        it('should throw when withdrawal made for until-first-withdrawal promotion', () => {
            const promotion = createPromotion({
                qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
            });

            expect(() =>
                policy.validateUntilFirstWithdrawalEligibility(promotion, true),
            ).toThrow(PromotionNotEligibleException);
        });


    });

    describe('validateEligibility', () => {
        it('should pass all validations for eligible user', () => {
            const promotion = createPromotion();
            const currencySettings = createCurrencySettings();
            const now = new Date('2024-06-15');

            expect(() =>
                policy.validateEligibility(
                    promotion,
                    new Prisma.Decimal(100),
                    currencySettings,
                    null,
                    false,
                    false,
                    now,
                ),
            ).not.toThrow();
        });

        it('should throw for inactive promotion', () => {
            const promotion = createPromotion({ isActive: false });
            const currencySettings = createCurrencySettings();

            expect(() =>
                policy.validateEligibility(
                    promotion,
                    new Prisma.Decimal(100),
                    currencySettings,
                    null,
                    false,
                    false,
                ),
            ).toThrow(PromotionNotActiveException);
        });

        it('should throw for insufficient deposit', () => {
            const promotion = createPromotion();
            const currencySettings = createCurrencySettings({
                minDepositAmount: new Prisma.Decimal(200),
            });
            const now = new Date('2024-06-15');

            expect(() =>
                policy.validateEligibility(
                    promotion,
                    new Prisma.Decimal(100),
                    currencySettings,
                    null,
                    false,
                    false,
                    now,
                ),
            ).toThrow(PromotionNotEligibleException);
        });
    });
});
