// src/modules/promotion/domain/model/user-promotion.entity.spec.ts
import { Prisma, ExchangeCurrencyCode, UserPromotionStatus } from '@repo/database';
import { UserPromotion } from './user-promotion.entity';

describe('UserPromotion Entity', () => {
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

    describe('fromPersistence', () => {
        it('should create from persistence data', () => {
            const userPromotion = createUserPromotion();

            expect(userPromotion.id).toBe(1);
            expect(userPromotion.userId).toBe(BigInt(100));
            expect(userPromotion.promotionId).toBe(1);
            expect(userPromotion.status).toBe(UserPromotionStatus.ACTIVE);
            expect(userPromotion.depositAmount).toEqual(new Prisma.Decimal(100));
            expect(userPromotion.bonusAmount).toEqual(new Prisma.Decimal(10));
        });
    });

    describe('bonusGranted', () => {
        it('should return true when bonus amount is greater than 0', () => {
            const userPromotion = createUserPromotion({
                bonusAmount: new Prisma.Decimal(10),
            });

            expect(userPromotion.bonusGranted).toBe(true);
        });

        it('should return false when bonus amount is 0', () => {
            const userPromotion = createUserPromotion({
                bonusAmount: new Prisma.Decimal(0),
            });

            expect(userPromotion.bonusGranted).toBe(false);
        });
    });

    describe('rolling amount management', () => {
        it('should set rolling amount', () => {
            const userPromotion = createUserPromotion();

            userPromotion.setRollingAmount(new Prisma.Decimal(25));

            expect(userPromotion.currentRollingAmount).toEqual(new Prisma.Decimal(25));
        });

        it('should add rolling amount', () => {
            const userPromotion = createUserPromotion({
                currentRollingAmount: new Prisma.Decimal(10),
            });

            userPromotion.addRollingAmount(new Prisma.Decimal(15));

            expect(userPromotion.currentRollingAmount).toEqual(new Prisma.Decimal(25));
        });
    });

    describe('isRollingCompleted', () => {
        it('should return true when rolling is complete', () => {
            const userPromotion = createUserPromotion({
                targetRollingAmount: new Prisma.Decimal(50),
                currentRollingAmount: new Prisma.Decimal(50),
            });

            expect(userPromotion.isRollingCompleted()).toBe(true);
        });

        it('should return true when rolling exceeds target', () => {
            const userPromotion = createUserPromotion({
                targetRollingAmount: new Prisma.Decimal(50),
                currentRollingAmount: new Prisma.Decimal(100),
            });

            expect(userPromotion.isRollingCompleted()).toBe(true);
        });

        it('should return false when rolling is not complete', () => {
            const userPromotion = createUserPromotion({
                targetRollingAmount: new Prisma.Decimal(50),
                currentRollingAmount: new Prisma.Decimal(25),
            });

            expect(userPromotion.isRollingCompleted()).toBe(false);
        });
    });

    describe('status management', () => {
        it('should mark as completed', () => {
            const userPromotion = createUserPromotion();

            userPromotion.markAsCompleted();

            expect(userPromotion.status).toBe(UserPromotionStatus.COMPLETED);
            expect(userPromotion.isCompleted()).toBe(true);
            expect(userPromotion.isActive()).toBe(false);
        });

        it('should mark as qualification lost', () => {
            const userPromotion = createUserPromotion();

            userPromotion.markAsQualificationLost();

            expect(userPromotion.status).toBe(UserPromotionStatus.QUALIFICATION_LOST);
        });

        it('should mark as expired', () => {
            const userPromotion = createUserPromotion();

            userPromotion.markAsExpired();

            expect(userPromotion.status).toBe(UserPromotionStatus.EXPIRED);
        });

        it('should mark as failed', () => {
            const userPromotion = createUserPromotion();

            userPromotion.markAsFailed();

            expect(userPromotion.status).toBe(UserPromotionStatus.FAILED);
        });
    });

    describe('isActive', () => {
        it('should return true for ACTIVE status', () => {
            const userPromotion = createUserPromotion({
                status: UserPromotionStatus.ACTIVE,
            });

            expect(userPromotion.isActive()).toBe(true);
        });

        it('should return false for non-ACTIVE status', () => {
            const userPromotion = createUserPromotion({
                status: UserPromotionStatus.COMPLETED,
            });

            expect(userPromotion.isActive()).toBe(false);
        });
    });

    describe('toPersistence', () => {
        it('should convert to persistence format', () => {
            const userPromotion = createUserPromotion();
            userPromotion.addRollingAmount(new Prisma.Decimal(10));

            const persistence = userPromotion.toPersistence();

            expect(persistence.id).toBe(1);
            expect(persistence.userId).toBe(BigInt(100));
            expect(persistence.currentRollingAmount).toEqual(new Prisma.Decimal(10));
        });
    });
});
