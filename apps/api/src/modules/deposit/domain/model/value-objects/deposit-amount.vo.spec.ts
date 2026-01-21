// src/modules/deposit/domain/model/value-objects/deposit-amount.vo.spec.ts
import { Prisma, FeePaidByType } from '@prisma/client';
import { DepositAmount } from './deposit-amount.vo';

describe('DepositAmount Value Object', () => {
    describe('create', () => {
        it('should create with only requested amount', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
            });

            expect(amount.requestedAmount).toEqual(new Prisma.Decimal(100));
            expect(amount.actuallyPaid).toBeNull();
            expect(amount.feeAmount).toBeNull();
            expect(amount.feeCurrency).toBeNull();
            expect(amount.feePaidBy).toBeNull();
        });

        it('should create with fee information', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
                feeAmount: new Prisma.Decimal(5),
                feeCurrency: 'USDT',
                feePaidBy: FeePaidByType.USER,
            });

            expect(amount.requestedAmount).toEqual(new Prisma.Decimal(100));
            expect(amount.feeAmount).toEqual(new Prisma.Decimal(5));
            expect(amount.feeCurrency).toBe('USDT');
            expect(amount.feePaidBy).toBe(FeePaidByType.USER);
        });
    });

    describe('fromPersistence', () => {
        it('should create from persistence data with all fields', () => {
            const amount = DepositAmount.fromPersistence({
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: new Prisma.Decimal(95),
                feeAmount: new Prisma.Decimal(5),
                feeCurrency: 'USDT',
                feePaidBy: FeePaidByType.USER,
            });

            expect(amount.requestedAmount).toEqual(new Prisma.Decimal(100));
            expect(amount.actuallyPaid).toEqual(new Prisma.Decimal(95));
            expect(amount.feeAmount).toEqual(new Prisma.Decimal(5));
        });

        it('should create from persistence data with null values', () => {
            const amount = DepositAmount.fromPersistence({
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: null,
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
            });

            expect(amount.requestedAmount).toEqual(new Prisma.Decimal(100));
            expect(amount.actuallyPaid).toBeNull();
            expect(amount.feeAmount).toBeNull();
        });
    });

    describe('toPersistence', () => {
        it('should convert to persistence format', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
                feeAmount: new Prisma.Decimal(5),
                feeCurrency: 'USDT',
                feePaidBy: FeePaidByType.SYSTEM,
            });

            const persistence = amount.toPersistence();

            expect(persistence).toEqual({
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: null,
                feeAmount: new Prisma.Decimal(5),
                feeCurrency: 'USDT',
                feePaidBy: FeePaidByType.SYSTEM,
            });
        });
    });

    describe('hasActuallyPaid', () => {
        it('should return false when actuallyPaid is null', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
            });

            expect(amount.hasActuallyPaid()).toBe(false);
        });

        it('should return true when actuallyPaid is set', () => {
            const amount = DepositAmount.fromPersistence({
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: new Prisma.Decimal(100),
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
            });

            expect(amount.hasActuallyPaid()).toBe(true);
        });
    });

    describe('hasFee', () => {
        it('should return false when no fee', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
            });

            expect(amount.hasFee()).toBe(false);
        });

        it('should return false when fee is zero', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
                feeAmount: new Prisma.Decimal(0),
            });

            expect(amount.hasFee()).toBe(false);
        });

        it('should return true when fee exists', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
                feeAmount: new Prisma.Decimal(5),
            });

            expect(amount.hasFee()).toBe(true);
        });
    });

    describe('isFeePaidByUser', () => {
        it('should return true when fee paid by user', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
                feeAmount: new Prisma.Decimal(5),
                feePaidBy: FeePaidByType.USER,
            });

            expect(amount.isFeePaidByUser()).toBe(true);
            expect(amount.isFeePaidBySystem()).toBe(false);
        });
    });

    describe('isFeePaidBySystem', () => {
        it('should return true when fee paid by system', () => {
            const amount = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
                feeAmount: new Prisma.Decimal(5),
                feePaidBy: FeePaidByType.SYSTEM,
            });

            expect(amount.isFeePaidBySystem()).toBe(true);
            expect(amount.isFeePaidByUser()).toBe(false);
        });
    });

    describe('withActuallyPaid', () => {
        it('should return new instance with actuallyPaid set', () => {
            const original = DepositAmount.create({
                requestedAmount: new Prisma.Decimal(100),
                feeAmount: new Prisma.Decimal(5),
                feeCurrency: 'USDT',
                feePaidBy: FeePaidByType.USER,
            });

            const updated = original.withActuallyPaid(new Prisma.Decimal(95));

            // Original should not be modified
            expect(original.actuallyPaid).toBeNull();

            // New instance should have actuallyPaid
            expect(updated.actuallyPaid).toEqual(new Prisma.Decimal(95));
            expect(updated.requestedAmount).toEqual(new Prisma.Decimal(100));
            expect(updated.feeAmount).toEqual(new Prisma.Decimal(5));
            expect(updated.feeCurrency).toBe('USDT');
            expect(updated.feePaidBy).toBe(FeePaidByType.USER);
        });
    });
});
