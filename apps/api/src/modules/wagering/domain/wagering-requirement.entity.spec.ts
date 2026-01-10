// src/modules/wagering/domain/wagering-requirement.entity.spec.ts
import { Prisma, ExchangeCurrencyCode, WageringSourceType, WageringStatus } from '@repo/database';
import { WageringRequirement } from './wagering-requirement.entity';

describe('WageringRequirement Entity', () => {
    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;
    const sourceType = 'DEPOSIT' as WageringSourceType;

    describe('create', () => {
        it('should create a new wagering requirement with default values', () => {
            const requirement = WageringRequirement.create({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
            });

            expect(requirement.id).toBeNull();
            expect(requirement.uid).toBeDefined();
            expect(requirement.userId).toBe(userId);
            expect(requirement.currency).toBe(currency);
            expect(requirement.sourceType).toBe(sourceType);
            expect(requirement.requiredAmount).toEqual(new Prisma.Decimal(100));
            expect(requirement.currentAmount).toEqual(new Prisma.Decimal(0));
            expect(requirement.status).toBe('ACTIVE');
            expect(requirement.priority).toBe(0);
        });

        it('should create with optional parameters', () => {
            const expiresAt = new Date('2024-12-31');
            const requirement = WageringRequirement.create({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                priority: 10,
                depositDetailId: BigInt(5),
                userPromotionId: BigInt(3),
                expiresAt,
                cancellationBalanceThreshold: new Prisma.Decimal(0.1),
            });

            expect(requirement.priority).toBe(10);
            expect(requirement.depositDetailId).toBe(BigInt(5));
            expect(requirement.userPromotionId).toBe(BigInt(3));
            expect(requirement.expiresAt).toBe(expiresAt);
            expect(requirement.cancellationBalanceThreshold).toEqual(new Prisma.Decimal(0.1));
        });
    });

    describe('rehydrate', () => {
        it('should rehydrate from props', () => {
            const now = new Date();
            const requirement = WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'wagering-uid-123',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                currentAmount: new Prisma.Decimal(50),
                cancellationBalanceThreshold: null,
                status: 'ACTIVE' as WageringStatus,
                priority: 5,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: now,
                updatedAt: now,
                expiresAt: null,
                completedAt: null,
                cancelledAt: null,
                cancellationNote: null,
            });

            expect(requirement.id).toBe(BigInt(1));
            expect(requirement.uid).toBe('wagering-uid-123');
            expect(requirement.currentAmount).toEqual(new Prisma.Decimal(50));
            expect(requirement.status).toBe('ACTIVE');
        });
    });

    describe('remainingAmount', () => {
        it('should calculate remaining amount correctly', () => {
            const requirement = WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'uid',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                currentAmount: new Prisma.Decimal(30),
                cancellationBalanceThreshold: null,
                status: 'ACTIVE' as WageringStatus,
                priority: 0,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                completedAt: null,
                cancelledAt: null,
                cancellationNote: null,
            });

            expect(requirement.remainingAmount).toEqual(new Prisma.Decimal(70));
        });

        it('should return 0 when current exceeds required', () => {
            const requirement = WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'uid',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                currentAmount: new Prisma.Decimal(150), // Exceeded
                cancellationBalanceThreshold: null,
                status: 'COMPLETED' as WageringStatus,
                priority: 0,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                completedAt: new Date(),
                cancelledAt: null,
                cancellationNote: null,
            });

            expect(requirement.remainingAmount).toEqual(new Prisma.Decimal(0));
        });
    });

    describe('contribute', () => {
        const createActiveRequirement = (required: number, current: number) => {
            return WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'uid',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(required),
                currentAmount: new Prisma.Decimal(current),
                cancellationBalanceThreshold: null,
                status: 'ACTIVE' as WageringStatus,
                priority: 0,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                completedAt: null,
                cancelledAt: null,
                cancellationNote: null,
            });
        };

        it('should contribute full amount when within limit', () => {
            const requirement = createActiveRequirement(100, 0);

            const contributed = requirement.contribute(new Prisma.Decimal(50));

            expect(contributed).toEqual(new Prisma.Decimal(50));
            expect(requirement.currentAmount).toEqual(new Prisma.Decimal(50));
            expect(requirement.isActive).toBe(true);
        });

        it('should cap contribution to remaining amount', () => {
            const requirement = createActiveRequirement(100, 80);

            const contributed = requirement.contribute(new Prisma.Decimal(50)); // Only 20 remaining

            expect(contributed).toEqual(new Prisma.Decimal(20));
            expect(requirement.currentAmount).toEqual(new Prisma.Decimal(100));
            expect(requirement.isCompleted).toBe(true);
        });

        it('should auto-complete when reaching required amount', () => {
            const requirement = createActiveRequirement(100, 50);

            requirement.contribute(new Prisma.Decimal(50));

            expect(requirement.isCompleted).toBe(true);
            expect(requirement.completedAt).toBeInstanceOf(Date);
        });

        it('should return 0 when not active', () => {
            const requirement = WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'uid',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                currentAmount: new Prisma.Decimal(50),
                cancellationBalanceThreshold: null,
                status: 'COMPLETED' as WageringStatus,
                priority: 0,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                completedAt: new Date(),
                cancelledAt: null,
                cancellationNote: null,
            });

            const contributed = requirement.contribute(new Prisma.Decimal(50));

            expect(contributed).toEqual(new Prisma.Decimal(0));
        });
    });

    describe('complete', () => {
        it('should mark as completed', () => {
            const requirement = WageringRequirement.create({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
            });

            requirement.complete();

            expect(requirement.status).toBe('COMPLETED');
            expect(requirement.completedAt).toBeInstanceOf(Date);
        });

        it('should not change if already completed', () => {
            const completedAt = new Date('2024-01-01');
            const requirement = WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'uid',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                currentAmount: new Prisma.Decimal(100),
                cancellationBalanceThreshold: null,
                status: 'COMPLETED' as WageringStatus,
                priority: 0,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                completedAt,
                cancelledAt: null,
                cancellationNote: null,
            });

            requirement.complete();

            expect(requirement.completedAt).toBe(completedAt); // Should not change
        });
    });

    describe('cancel', () => {
        it('should cancel with note', () => {
            const requirement = WageringRequirement.create({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
            });

            requirement.cancel('Insufficient balance');

            expect(requirement.status).toBe('CANCELLED');
            expect(requirement.cancelledAt).toBeInstanceOf(Date);
            expect(requirement.cancellationNote).toBe('Insufficient balance');
        });

        it('should not cancel if not active', () => {
            const requirement = WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'uid',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                currentAmount: new Prisma.Decimal(100),
                cancellationBalanceThreshold: null,
                status: 'COMPLETED' as WageringStatus,
                priority: 0,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                completedAt: new Date(),
                cancelledAt: null,
                cancellationNote: null,
            });

            requirement.cancel('Test');

            expect(requirement.status).toBe('COMPLETED');
        });
    });

    describe('void', () => {
        it('should void requirement', () => {
            const requirement = WageringRequirement.create({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
            });

            requirement.void('Admin action');

            expect(requirement.status).toBe('VOIDED');
            expect(requirement.cancellationNote).toBe('Admin action');
        });
    });

    describe('expire', () => {
        it('should expire active requirement', () => {
            const requirement = WageringRequirement.create({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
            });

            requirement.expire();

            expect(requirement.status).toBe('EXPIRED');
        });

        it('should not expire if not active', () => {
            const requirement = WageringRequirement.rehydrate({
                id: BigInt(1),
                uid: 'uid',
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                currentAmount: new Prisma.Decimal(100),
                cancellationBalanceThreshold: null,
                status: 'COMPLETED' as WageringStatus,
                priority: 0,
                depositDetailId: null,
                userPromotionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                completedAt: new Date(),
                cancelledAt: null,
                cancellationNote: null,
            });

            requirement.expire();

            expect(requirement.status).toBe('COMPLETED');
        });
    });

    describe('isActive / isCompleted', () => {
        it('should return true for active status', () => {
            const requirement = WageringRequirement.create({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
            });

            expect(requirement.isActive).toBe(true);
            expect(requirement.isCompleted).toBe(false);
        });
    });
});
