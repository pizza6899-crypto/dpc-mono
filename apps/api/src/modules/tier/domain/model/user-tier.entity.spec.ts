// src/modules/tier/domain/model/user-tier.entity.spec.ts
import { Prisma } from 'src/generated/prisma';
import { UserTier } from './user-tier.entity';
import { Tier } from './tier.entity';
import { InvalidRollingAmountException, TierException } from '../tier.exception';

describe('UserTier Entity', () => {
    const userId = BigInt(100);
    const tierId = BigInt(1);

    const createMockTier = (params: Partial<{
        id: bigint;
        priority: number;
        code: string;
        requirementUsd: number;
        levelUpBonusUsd: number;
    }> = {}): Tier => {
        return Tier.fromPersistence({
            id: params.id ?? BigInt(1),
            uid: 'tier-uid',
            priority: params.priority ?? 1,
            code: params.code ?? 'BRONZE',
            requirementUsd: new Prisma.Decimal(params.requirementUsd ?? 0),
            levelUpBonusUsd: new Prisma.Decimal(params.levelUpBonusUsd ?? 0),
            compRate: new Prisma.Decimal(0),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    describe('create', () => {
        it('should create a new user tier with required fields', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
            });

            expect(userTier.id).toBeNull();
            expect(userTier.uid).toBeDefined();
            expect(userTier.userId).toBe(userId);
            expect(userTier.tierId).toBe(tierId);
            expect(userTier.totalRollingUsd).toEqual(new Prisma.Decimal(0));
            expect(userTier.highestPromotedPriority).toBe(0);
            expect(userTier.isManualLock).toBe(false);
            expect(userTier.lastPromotedAt).toBeInstanceOf(Date);
            expect(userTier.createdAt).toBeInstanceOf(Date);
            expect(userTier.updatedAt).toBeInstanceOf(Date);
        });

        it('should create user tier with all optional fields', () => {
            const tier = createMockTier({ id: tierId, priority: 3 });
            const promotedAt = new Date('2024-01-01');

            const userTier = UserTier.create({
                id: BigInt(10),
                uid: 'custom-uid',
                userId,
                tierId,
                totalRollingUsd: 50000,
                highestPromotedPriority: 3,
                isManualLock: true,
                lastPromotedAt: promotedAt,
                tier,
            });

            expect(userTier.id).toBe(BigInt(10));
            expect(userTier.uid).toBe('custom-uid');
            expect(userTier.totalRollingUsd).toEqual(new Prisma.Decimal(50000));
            expect(userTier.highestPromotedPriority).toBe(3);
            expect(userTier.isManualLock).toBe(true);
            expect(userTier.lastPromotedAt).toBe(promotedAt);
            expect(userTier.tier).toBe(tier);
        });

        it('should accept Prisma.Decimal as totalRollingUsd', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                totalRollingUsd: new Prisma.Decimal(12345.67),
            });

            expect(userTier.totalRollingUsd).toEqual(new Prisma.Decimal(12345.67));
        });
    });

    describe('fromPersistence', () => {
        it('should create user tier from persistence data', () => {
            const now = new Date();
            const tier = createMockTier();

            const userTier = UserTier.fromPersistence({
                id: BigInt(5),
                uid: 'ut-uid',
                userId,
                tierId,
                totalRollingUsd: new Prisma.Decimal(25000),
                highestPromotedPriority: 2,
                isManualLock: false,
                lastPromotedAt: now,
                createdAt: now,
                updatedAt: now,
                tier,
            });

            expect(userTier.id).toBe(BigInt(5));
            expect(userTier.uid).toBe('ut-uid');
            expect(userTier.userId).toBe(userId);
            expect(userTier.tierId).toBe(tierId);
            expect(userTier.totalRollingUsd).toEqual(new Prisma.Decimal(25000));
            expect(userTier.highestPromotedPriority).toBe(2);
            expect(userTier.isManualLock).toBe(false);
            expect(userTier.lastPromotedAt).toBe(now);
            expect(userTier.tier).toBe(tier);
        });
    });

    describe('addRolling', () => {
        it('should add positive rolling amount', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                totalRollingUsd: 10000,
            });

            userTier.addRolling(new Prisma.Decimal(5000));

            expect(userTier.totalRollingUsd).toEqual(new Prisma.Decimal(15000));
        });

        it('should accumulate multiple rolling additions', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                totalRollingUsd: 0,
            });

            userTier.addRolling(new Prisma.Decimal(1000));
            userTier.addRolling(new Prisma.Decimal(2500));
            userTier.addRolling(new Prisma.Decimal(500));

            expect(userTier.totalRollingUsd).toEqual(new Prisma.Decimal(4000));
        });

        it('should throw error for zero amount', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
            });

            expect(() => {
                userTier.addRolling(new Prisma.Decimal(0));
            }).toThrow(InvalidRollingAmountException);
        });

        it('should throw error for negative amount', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
            });

            expect(() => {
                userTier.addRolling(new Prisma.Decimal(-100));
            }).toThrow(InvalidRollingAmountException);
        });

        it('should handle decimal precision', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                totalRollingUsd: new Prisma.Decimal('100.12'),
            });

            userTier.addRolling(new Prisma.Decimal('50.88'));

            expect(userTier.totalRollingUsd).toEqual(new Prisma.Decimal('151'));
        });
    });

    describe('canUpgradeTo', () => {
        it('should return true when rolling meets requirement and tier is higher', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1, requirementUsd: 0 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 15000,
                tier: currentTier,
            });

            expect(userTier.canUpgradeTo(targetTier)).toBe(true);
        });

        it('should return false when rolling does not meet requirement', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1, requirementUsd: 0 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 5000,
                tier: currentTier,
            });

            expect(userTier.canUpgradeTo(targetTier)).toBe(false);
        });

        it('should return false when target tier has lower or equal priority', () => {
            const currentTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });
            const targetTier = createMockTier({ id: BigInt(1), priority: 1, requirementUsd: 0 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(2),
                totalRollingUsd: 50000,
                tier: currentTier,
            });

            expect(userTier.canUpgradeTo(targetTier)).toBe(false);
        });

        it('should return false when manually locked', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1, requirementUsd: 0 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 50000,
                isManualLock: true,
                tier: currentTier,
            });

            expect(userTier.canUpgradeTo(targetTier)).toBe(false);
        });

        it('should return true when locked but forceOverride is true', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1, requirementUsd: 0 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 50000,
                isManualLock: true,
                tier: currentTier,
            });

            expect(userTier.canUpgradeTo(targetTier, true)).toBe(true);
        });

        it('should return true when rolling exactly matches requirement', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 10000,
                tier: currentTier,
            });

            expect(userTier.canUpgradeTo(targetTier)).toBe(true);
        });
    });

    describe('upgradeTo', () => {
        it('should upgrade tier and update lastPromotedAt', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });
            const oldPromotedAt = new Date('2024-01-01');

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 15000,
                lastPromotedAt: oldPromotedAt,
                tier: currentTier,
            });

            userTier.upgradeTo(targetTier);

            expect(userTier.tierId).toBe(BigInt(2));
            expect(userTier.lastPromotedAt.getTime()).toBeGreaterThan(oldPromotedAt.getTime());
        });

        it('should update highestPromotedPriority when reaching new peak', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(3), priority: 3, requirementUsd: 25000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 30000,
                highestPromotedPriority: 1,
                tier: currentTier,
            });

            userTier.upgradeTo(targetTier);

            expect(userTier.highestPromotedPriority).toBe(3);
        });

        it('should not update highestPromotedPriority when below previous peak', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 15000,
                highestPromotedPriority: 5, // 이전에 더 높은 티어 도달
                tier: currentTier,
            });

            userTier.upgradeTo(targetTier);

            expect(userTier.highestPromotedPriority).toBe(5);
        });

        it('should throw error when target tier has no id', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = Tier.create({
                priority: 2,
                code: 'SILVER',
                requirementUsd: 0,
            }); // id is null

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 50000,
                tier: currentTier,
            });

            expect(() => {
                userTier.upgradeTo(targetTier);
            }).toThrow(TierException);
        });

        it('should throw error when rolling requirement not met', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2, requirementUsd: 10000 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 5000, // 요구량 미달
                tier: currentTier,
            });

            expect(() => {
                userTier.upgradeTo(targetTier);
            }).toThrow(InvalidRollingAmountException);
        });
    });

    describe('isEligibleForLevelUpBonus', () => {
        it('should return true when target priority exceeds highest achieved', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                highestPromotedPriority: 2,
            });

            const targetTier = createMockTier({ priority: 3 });

            expect(userTier.isEligibleForLevelUpBonus(targetTier)).toBe(true);
        });

        it('should return false when target priority equals highest achieved', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                highestPromotedPriority: 3,
            });

            const targetTier = createMockTier({ priority: 3 });

            expect(userTier.isEligibleForLevelUpBonus(targetTier)).toBe(false);
        });

        it('should return false when target priority is below highest achieved', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                highestPromotedPriority: 5,
            });

            const targetTier = createMockTier({ priority: 3 });

            expect(userTier.isEligibleForLevelUpBonus(targetTier)).toBe(false);
        });
    });

    describe('forceChangeTier', () => {
        it('should change tier and set manual lock', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(3), priority: 3 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                isManualLock: false,
                tier: currentTier,
            });

            userTier.forceChangeTier(targetTier, true);

            expect(userTier.tierId).toBe(BigInt(3));
            expect(userTier.isManualLock).toBe(true);
        });

        it('should change tier without lock', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(2), priority: 2 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                isManualLock: true, // 기존에 잠김
                tier: currentTier,
            });

            userTier.forceChangeTier(targetTier, false);

            expect(userTier.tierId).toBe(BigInt(2));
            expect(userTier.isManualLock).toBe(false);
        });

        it('should update highestPromotedPriority on promotion', () => {
            const currentTier = createMockTier({ id: BigInt(1), priority: 1 });
            const targetTier = createMockTier({ id: BigInt(4), priority: 4 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
                highestPromotedPriority: 2,
                tier: currentTier,
            });

            userTier.forceChangeTier(targetTier, true);

            expect(userTier.highestPromotedPriority).toBe(4);
        });

        it('should not update highestPromotedPriority on demotion', () => {
            const currentTier = createMockTier({ id: BigInt(3), priority: 3 });
            const targetTier = createMockTier({ id: BigInt(1), priority: 1 });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(3),
                highestPromotedPriority: 3,
                tier: currentTier,
            });

            userTier.forceChangeTier(targetTier, true);

            expect(userTier.highestPromotedPriority).toBe(3);
        });

        it('should throw error when target tier has no id', () => {
            const targetTier = Tier.create({
                priority: 2,
                code: 'SILVER',
                requirementUsd: 0,
            });

            const userTier = UserTier.create({
                userId,
                tierId: BigInt(1),
            });

            expect(() => {
                userTier.forceChangeTier(targetTier, true);
            }).toThrow(TierException);
        });
    });

    describe('unlock', () => {
        it('should set isManualLock to false', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                isManualLock: true,
            });

            expect(userTier.isManualLock).toBe(true);

            userTier.unlock();

            expect(userTier.isManualLock).toBe(false);
        });

        it('should remain unlocked when already unlocked', () => {
            const userTier = UserTier.create({
                userId,
                tierId,
                isManualLock: false,
            });

            userTier.unlock();

            expect(userTier.isManualLock).toBe(false);
        });
    });
});
