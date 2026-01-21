// src/modules/comp/domain/model/comp-wallet.entity.spec.ts
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { CompWallet } from './comp-wallet.entity';
import { InsufficientCompBalanceException } from '../comp.exception';

describe('CompWallet Entity', () => {
    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;

    describe('create', () => {
        it('should create a new comp wallet with default values', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
            });

            expect(wallet.userId).toBe(userId);
            expect(wallet.currency).toBe(currency);
            expect(wallet.balance).toEqual(new Prisma.Decimal(0));
            expect(wallet.totalEarned).toEqual(new Prisma.Decimal(0));
            expect(wallet.totalUsed).toEqual(new Prisma.Decimal(0));
            expect(wallet.createdAt).toBeInstanceOf(Date);
            expect(wallet.updatedAt).toBeInstanceOf(Date);
        });

        it('should create a wallet with custom values', () => {
            const wallet = CompWallet.create({
                id: BigInt(1),
                userId,
                currency,
                balance: new Prisma.Decimal(100),
                totalEarned: new Prisma.Decimal(200),
                totalUsed: new Prisma.Decimal(100),
            });

            expect(wallet.id).toBe(BigInt(1));
            expect(wallet.balance).toEqual(new Prisma.Decimal(100));
            expect(wallet.totalEarned).toEqual(new Prisma.Decimal(200));
            expect(wallet.totalUsed).toEqual(new Prisma.Decimal(100));
        });
    });

    describe('earn', () => {
        it('should increase balance and totalEarned', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(50),
                totalEarned: new Prisma.Decimal(100),
            });

            const result = wallet.earn(new Prisma.Decimal(30));

            expect(result.balance).toEqual(new Prisma.Decimal(80));
            expect(result.totalEarned).toEqual(new Prisma.Decimal(130));
            expect(result.totalUsed).toEqual(wallet.totalUsed); // unchanged
        });

        it('should return a new instance (immutability)', () => {
            const wallet = CompWallet.create({ userId, currency });
            const result = wallet.earn(new Prisma.Decimal(10));

            expect(result).not.toBe(wallet);
            expect(wallet.balance).toEqual(new Prisma.Decimal(0)); // original unchanged
        });

        it('should update updatedAt timestamp', () => {
            const oldDate = new Date('2024-01-01');
            const wallet = CompWallet.create({
                userId,
                currency,
                updatedAt: oldDate,
            });

            const result = wallet.earn(new Prisma.Decimal(10));

            expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
        });
    });

    describe('claim', () => {
        it('should decrease balance and increase totalUsed', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(100),
                totalUsed: new Prisma.Decimal(50),
            });

            const result = wallet.claim(new Prisma.Decimal(30));

            expect(result.balance).toEqual(new Prisma.Decimal(70));
            expect(result.totalUsed).toEqual(new Prisma.Decimal(80));
            expect(result.totalEarned).toEqual(wallet.totalEarned); // unchanged
        });

        it('should allow claiming entire balance', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(100),
            });

            const result = wallet.claim(new Prisma.Decimal(100));

            expect(result.balance).toEqual(new Prisma.Decimal(0));
        });

        it('should throw InsufficientCompBalanceException when balance is insufficient', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(50),
            });

            expect(() => wallet.claim(new Prisma.Decimal(100))).toThrow(
                InsufficientCompBalanceException,
            );
        });

        it('should throw with correct error message', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(50),
            });

            expect(() => wallet.claim(new Prisma.Decimal(100))).toThrow(
                /Insufficient comp balance.*Required: 100.*Current: 50/,
            );
        });

        it('should return a new instance (immutability)', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(100),
            });
            const result = wallet.claim(new Prisma.Decimal(10));

            expect(result).not.toBe(wallet);
            expect(wallet.balance).toEqual(new Prisma.Decimal(100)); // original unchanged
        });
    });

    describe('deduct', () => {
        it('should decrease balance and increase totalUsed', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(100),
                totalUsed: new Prisma.Decimal(50),
            });

            const result = wallet.deduct(new Prisma.Decimal(20));

            expect(result.balance).toEqual(new Prisma.Decimal(80));
            expect(result.totalUsed).toEqual(new Prisma.Decimal(70));
        });

        it('should throw InsufficientCompBalanceException when balance is insufficient', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(30),
            });

            expect(() => wallet.deduct(new Prisma.Decimal(50))).toThrow(
                InsufficientCompBalanceException,
            );
        });

        it('should allow deducting entire balance', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(100),
            });

            const result = wallet.deduct(new Prisma.Decimal(100));

            expect(result.balance).toEqual(new Prisma.Decimal(0));
        });

        it('should return a new instance (immutability)', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal(100),
            });
            const result = wallet.deduct(new Prisma.Decimal(10));

            expect(result).not.toBe(wallet);
        });
    });

    describe('decimal precision', () => {
        it('should handle decimal calculations correctly', () => {
            const wallet = CompWallet.create({
                userId,
                currency,
                balance: new Prisma.Decimal('100.123456'),
            });

            const result = wallet.earn(new Prisma.Decimal('0.000001'));

            expect(result.balance.toString()).toBe('100.123457');
        });
    });
});
