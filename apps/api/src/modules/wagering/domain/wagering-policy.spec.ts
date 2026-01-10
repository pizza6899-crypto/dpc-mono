// src/modules/wagering/domain/wagering-policy.spec.ts
import { Prisma } from '@repo/database';
import { WageringPolicy } from './wagering-policy';

describe('WageringPolicy', () => {
    let policy: WageringPolicy;

    beforeEach(() => {
        policy = new WageringPolicy();
    });

    describe('canBeCancelled', () => {
        it('should return true when balance is below threshold', () => {
            const currentBalance = new Prisma.Decimal(0.05);
            const threshold = new Prisma.Decimal(0.1);

            expect(policy.canBeCancelled(currentBalance, threshold)).toBe(true);
        });

        it('should return false when balance equals threshold', () => {
            const currentBalance = new Prisma.Decimal(0.1);
            const threshold = new Prisma.Decimal(0.1);

            expect(policy.canBeCancelled(currentBalance, threshold)).toBe(false);
        });

        it('should return false when balance is above threshold', () => {
            const currentBalance = new Prisma.Decimal(100);
            const threshold = new Prisma.Decimal(0.1);

            expect(policy.canBeCancelled(currentBalance, threshold)).toBe(false);
        });

        it('should return false when threshold is null', () => {
            const currentBalance = new Prisma.Decimal(0);

            expect(policy.canBeCancelled(currentBalance, null)).toBe(false);
        });
    });

    describe('calculateContribution', () => {
        it('should calculate full contribution at 100%', () => {
            const betAmount = new Prisma.Decimal(1000);
            const rate = 1.0;

            const result = policy.calculateContribution(betAmount, rate);

            expect(result).toEqual(new Prisma.Decimal(1000));
        });

        it('should calculate partial contribution at 50%', () => {
            const betAmount = new Prisma.Decimal(1000);
            const rate = 0.5;

            const result = policy.calculateContribution(betAmount, rate);

            expect(result).toEqual(new Prisma.Decimal(500));
        });

        it('should calculate 10% contribution', () => {
            const betAmount = new Prisma.Decimal(1000);
            const rate = 0.1;

            const result = policy.calculateContribution(betAmount, rate);

            expect(result).toEqual(new Prisma.Decimal(100));
        });

        it('should return 0 for 0% rate', () => {
            const betAmount = new Prisma.Decimal(1000);
            const rate = 0;

            const result = policy.calculateContribution(betAmount, rate);

            expect(result).toEqual(new Prisma.Decimal(0));
        });
    });
});
