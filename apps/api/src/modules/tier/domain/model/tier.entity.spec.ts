// src/modules/tier/domain/model/tier.entity.spec.ts
import { Prisma } from '@repo/database';
import { Tier } from './tier.entity';
import { TierException } from '../tier.exception';

describe('Tier Entity', () => {
    describe('create', () => {
        it('should create a new tier with required fields', () => {
            const tier = Tier.create({
                priority: 1,
                code: 'BRONZE',
                requirementUsd: 0,
            });

            expect(tier.id).toBeNull();
            expect(tier.uid).toBeDefined();
            expect(tier.priority).toBe(1);
            expect(tier.code).toBe('BRONZE');
            expect(tier.requirementUsd).toEqual(new Prisma.Decimal(0));
            expect(tier.levelUpBonusUsd).toEqual(new Prisma.Decimal(0));
            expect(tier.compRate).toEqual(new Prisma.Decimal(0));
            expect(tier.createdAt).toBeInstanceOf(Date);
            expect(tier.updatedAt).toBeInstanceOf(Date);
        });

        it('should create a tier with all optional fields', () => {
            const tier = Tier.create({
                id: BigInt(1),
                uid: 'custom-uid',
                priority: 5,
                code: 'PLATINUM',
                requirementUsd: 50000,
                levelUpBonusUsd: 100,
                compRate: 0.05,
                displayName: 'Platinum Member',
                translations: [
                    { language: 'ko', name: '플래티넘' },
                    { language: 'en', name: 'Platinum' },
                ],
            });

            expect(tier.id).toBe(BigInt(1));
            expect(tier.uid).toBe('custom-uid');
            expect(tier.priority).toBe(5);
            expect(tier.code).toBe('PLATINUM');
            expect(tier.requirementUsd).toEqual(new Prisma.Decimal(50000));
            expect(tier.levelUpBonusUsd).toEqual(new Prisma.Decimal(100));
            expect(tier.compRate).toEqual(new Prisma.Decimal(0.05));
            expect(tier.displayName).toBe('Platinum Member');
            expect(tier.translations).toHaveLength(2);
        });

        it('should accept Prisma.Decimal as requirementUsd', () => {
            const tier = Tier.create({
                priority: 2,
                code: 'SILVER',
                requirementUsd: new Prisma.Decimal(10000.50),
            });

            expect(tier.requirementUsd).toEqual(new Prisma.Decimal(10000.50));
        });

        it('should throw error when duplicate language in translations', () => {
            expect(() => {
                Tier.create({
                    priority: 1,
                    code: 'BRONZE',
                    requirementUsd: 0,
                    translations: [
                        { language: 'ko', name: '브론즈' },
                        { language: 'ko', name: '청동' }, // 중복
                    ],
                });
            }).toThrow(TierException);
        });

        it('should throw error with message for duplicate language', () => {
            expect(() => {
                Tier.create({
                    priority: 1,
                    code: 'BRONZE',
                    requirementUsd: 0,
                    translations: [
                        { language: 'en', name: 'Bronze' },
                        { language: 'en', name: 'Bronze Medal' },
                    ],
                });
            }).toThrow('Duplicate language code in translations: en');
        });
    });

    describe('fromPersistence', () => {
        it('should create tier from persistence data', () => {
            const now = new Date();
            const tier = Tier.fromPersistence({
                id: BigInt(10),
                uid: 'tier-uid-123',
                priority: 3,
                code: 'GOLD',
                requirementUsd: new Prisma.Decimal(25000),
                levelUpBonusUsd: new Prisma.Decimal(50),
                compRate: new Prisma.Decimal(0.03),
                createdAt: now,
                updatedAt: now,
                translations: [{ language: 'ko', name: '골드' }],
            });

            expect(tier.id).toBe(BigInt(10));
            expect(tier.uid).toBe('tier-uid-123');
            expect(tier.priority).toBe(3);
            expect(tier.code).toBe('GOLD');
            expect(tier.requirementUsd).toEqual(new Prisma.Decimal(25000));
            expect(tier.levelUpBonusUsd).toEqual(new Prisma.Decimal(50));
            expect(tier.compRate).toEqual(new Prisma.Decimal(0.03));
            expect(tier.createdAt).toBe(now);
            expect(tier.updatedAt).toBe(now);
            expect(tier.translations).toHaveLength(1);
        });

        it('should handle empty translations array', () => {
            const tier = Tier.fromPersistence({
                id: BigInt(1),
                uid: 'uid',
                priority: 1,
                code: 'BRONZE',
                requirementUsd: new Prisma.Decimal(0),
                levelUpBonusUsd: new Prisma.Decimal(0),
                compRate: new Prisma.Decimal(0),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(tier.translations).toEqual([]);
        });
    });

    describe('toPersistence', () => {
        it('should convert tier to persistence format', () => {
            const tier = Tier.create({
                id: BigInt(5),
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000,
                levelUpBonusUsd: 25,
                compRate: 0.02,
            });

            const persistence = tier.toPersistence();

            expect(persistence.id).toBe(BigInt(5));
            expect(persistence.uid).toBe(tier.uid);
            expect(persistence.priority).toBe(2);
            expect(persistence.code).toBe('SILVER');
            expect(persistence.requirementUsd).toEqual(new Prisma.Decimal(10000));
            expect(persistence.levelUpBonusUsd).toEqual(new Prisma.Decimal(25));
            expect(persistence.compRate).toEqual(new Prisma.Decimal(0.02));
            expect(persistence.createdAt).toBeInstanceOf(Date);
            expect(persistence.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('isSatisfiedBy', () => {
        it('should return true when amount equals requirement', () => {
            const tier = Tier.create({
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000,
            });

            const result = tier.isSatisfiedBy(new Prisma.Decimal(10000));

            expect(result).toBe(true);
        });

        it('should return true when amount exceeds requirement', () => {
            const tier = Tier.create({
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000,
            });

            const result = tier.isSatisfiedBy(new Prisma.Decimal(15000));

            expect(result).toBe(true);
        });

        it('should return false when amount is less than requirement', () => {
            const tier = Tier.create({
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000,
            });

            const result = tier.isSatisfiedBy(new Prisma.Decimal(5000));

            expect(result).toBe(false);
        });

        it('should return true for zero requirement', () => {
            const tier = Tier.create({
                priority: 1,
                code: 'BRONZE',
                requirementUsd: 0,
            });

            const result = tier.isSatisfiedBy(new Prisma.Decimal(0));

            expect(result).toBe(true);
        });

        it('should handle decimal precision correctly', () => {
            const tier = Tier.create({
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000.55,
            });

            expect(tier.isSatisfiedBy(new Prisma.Decimal(10000.55))).toBe(true);
            expect(tier.isSatisfiedBy(new Prisma.Decimal(10000.54))).toBe(false);
            expect(tier.isSatisfiedBy(new Prisma.Decimal(10000.56))).toBe(true);
        });
    });
});
