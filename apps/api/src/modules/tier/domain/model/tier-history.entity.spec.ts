// src/modules/tier/domain/model/tier-history.entity.spec.ts
import { Prisma } from 'src/generated/prisma';
import { TierHistory, TierChangeType } from './tier-history.entity';

describe('TierHistory Entity', () => {
    const userId = BigInt(100);
    const fromTierId = BigInt(1);
    const toTierId = BigInt(2);

    describe('create', () => {
        it('should create a new tier history with required fields', () => {
            const history = TierHistory.create({
                userId,
                toTierId,
                changeType: TierChangeType.UPGRADE,
                rollingSnapshot: 15000,
            });

            expect(history.id).toBeNull();
            expect(history.uid).toBeDefined();
            expect(history.userId).toBe(userId);
            expect(history.fromTierId).toBeNull();
            expect(history.toTierId).toBe(toTierId);
            expect(history.changeType).toBe(TierChangeType.UPGRADE);
            expect(history.reason).toBe('Auto Update');
            expect(history.rollingSnapshot).toEqual(new Prisma.Decimal(15000));
            expect(history.bonusAmount).toEqual(new Prisma.Decimal(0));
            expect(history.createdAt).toBeInstanceOf(Date);
        });

        it('should create history with all optional fields', () => {
            const history = TierHistory.create({
                id: BigInt(10),
                uid: 'custom-uid',
                userId,
                fromTierId,
                toTierId,
                changeType: TierChangeType.UPGRADE,
                reason: 'Rolling accumulation',
                rollingSnapshot: 25000,
                bonusAmount: 100,
            });

            expect(history.id).toBe(BigInt(10));
            expect(history.uid).toBe('custom-uid');
            expect(history.fromTierId).toBe(fromTierId);
            expect(history.reason).toBe('Rolling accumulation');
            expect(history.bonusAmount).toEqual(new Prisma.Decimal(100));
        });

        it('should accept Prisma.Decimal for numeric fields', () => {
            const history = TierHistory.create({
                userId,
                toTierId,
                changeType: TierChangeType.MANUAL_UPDATE,
                rollingSnapshot: new Prisma.Decimal(12345.67),
                bonusAmount: new Prisma.Decimal(50.5),
            });

            expect(history.rollingSnapshot).toEqual(new Prisma.Decimal(12345.67));
            expect(history.bonusAmount).toEqual(new Prisma.Decimal(50.5));
        });

        it('should handle INITIAL change type', () => {
            const history = TierHistory.create({
                userId,
                toTierId,
                changeType: TierChangeType.INITIAL,
                reason: 'Initial Assignment',
                rollingSnapshot: 0,
            });

            expect(history.changeType).toBe(TierChangeType.INITIAL);
            expect(history.fromTierId).toBeNull();
            expect(history.reason).toBe('Initial Assignment');
        });

        it('should handle DOWNGRADE change type', () => {
            const history = TierHistory.create({
                userId,
                fromTierId: BigInt(3),
                toTierId: BigInt(1),
                changeType: TierChangeType.DOWNGRADE,
                reason: 'Admin demotion',
                rollingSnapshot: 5000,
            });

            expect(history.changeType).toBe(TierChangeType.DOWNGRADE);
            expect(history.fromTierId).toBe(BigInt(3));
            expect(history.toTierId).toBe(BigInt(1));
        });
    });

    describe('fromPersistence', () => {
        it('should create tier history from persistence data', () => {
            const now = new Date();

            const history = TierHistory.fromPersistence({
                id: BigInt(5),
                uid: 'history-uid',
                userId,
                fromTierId,
                toTierId,
                changeType: TierChangeType.UPGRADE,
                reason: 'Rolling accumulation',
                rollingSnapshot: new Prisma.Decimal(30000),
                bonusAmount: new Prisma.Decimal(75),
                createdAt: now,
            });

            expect(history.id).toBe(BigInt(5));
            expect(history.uid).toBe('history-uid');
            expect(history.userId).toBe(userId);
            expect(history.fromTierId).toBe(fromTierId);
            expect(history.toTierId).toBe(toTierId);
            expect(history.changeType).toBe(TierChangeType.UPGRADE);
            expect(history.reason).toBe('Rolling accumulation');
            expect(history.rollingSnapshot).toEqual(new Prisma.Decimal(30000));
            expect(history.bonusAmount).toEqual(new Prisma.Decimal(75));
            expect(history.createdAt).toBe(now);
        });

        it('should handle null fromTierId', () => {
            const history = TierHistory.fromPersistence({
                id: BigInt(1),
                uid: 'uid',
                userId,
                fromTierId: null,
                toTierId,
                changeType: TierChangeType.INITIAL,
                reason: 'Initial',
                rollingSnapshot: new Prisma.Decimal(0),
                bonusAmount: new Prisma.Decimal(0),
                createdAt: new Date(),
            });

            expect(history.fromTierId).toBeNull();
        });
    });

    describe('TierChangeType enum', () => {
        it('should have all expected values', () => {
            expect(TierChangeType.INITIAL).toBe('INITIAL');
            expect(TierChangeType.UPGRADE).toBe('UPGRADE');
            expect(TierChangeType.DOWNGRADE).toBe('DOWNGRADE');
            expect(TierChangeType.MANUAL_UPDATE).toBe('MANUAL_UPDATE');
        });
    });
});
