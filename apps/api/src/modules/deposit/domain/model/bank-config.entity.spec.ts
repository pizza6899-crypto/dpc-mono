// src/modules/deposit/domain/model/bank-config.entity.spec.ts
import { Prisma, ExchangeCurrencyCode } from 'src/generated/prisma';
import { BankConfig } from './bank-config.entity';

describe('BankConfig Entity', () => {
    const defaultParams = {
        uid: 'bank-uid-123',
        currency: ExchangeCurrencyCode.KRW,
        bankName: 'KB국민은행',
        accountNumber: '123-456-7890',
        accountHolder: '홍길동',
        minAmount: new Prisma.Decimal('10000'),
    };

    describe('create', () => {
        it('should create a new bank config with required fields', () => {
            const config = BankConfig.create(defaultParams);

            expect(config.id).toBeNull();
            expect(config.uid).toBe('bank-uid-123');
            expect(config.currency).toBe(ExchangeCurrencyCode.KRW);
            expect(config.bankName).toBe('KB국민은행');
            expect(config.accountNumber).toBe('123-456-7890');
            expect(config.accountHolder).toBe('홍길동');
            expect(config.isActive).toBe(true);
            expect(config.priority).toBe(0);
            expect(config.minAmount).toEqual(new Prisma.Decimal('10000'));
            expect(config.maxAmount).toBeNull();
            expect(config.totalDeposits).toBe(0);
            expect(config.totalDepositAmount).toEqual(new Prisma.Decimal(0));
            expect(config.createdAt).toBeInstanceOf(Date);
            expect(config.updatedAt).toBeInstanceOf(Date);
        });

        it('should create with optional fields', () => {
            const config = BankConfig.create({
                ...defaultParams,
                isActive: false,
                priority: 10,
                description: '주 계좌',
                notes: '운영 시간 09:00-18:00',
                maxAmount: new Prisma.Decimal('1000000'),
            });

            expect(config.isActive).toBe(false);
            expect(config.priority).toBe(10);
            expect(config.description).toBe('주 계좌');
            expect(config.notes).toBe('운영 시간 09:00-18:00');
            expect(config.maxAmount).toEqual(new Prisma.Decimal('1000000'));
        });
    });

    describe('fromPersistence', () => {
        it('should create entity from persistence data', () => {
            const now = new Date();
            const config = BankConfig.fromPersistence({
                id: BigInt(1),
                uid: 'bank-uid-123',
                currency: ExchangeCurrencyCode.KRW,
                bankName: 'KB국민은행',
                accountNumber: '123-456-7890',
                accountHolder: '홍길동',
                isActive: true,
                priority: 5,
                description: '설명',
                notes: null,
                minAmount: new Prisma.Decimal('10000'),
                maxAmount: new Prisma.Decimal('1000000'),
                totalDeposits: 100,
                totalDepositAmount: new Prisma.Decimal('5000000'),
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
            });

            expect(config.id).toBe(BigInt(1));
            expect(config.uid).toBe('bank-uid-123');
            expect(config.totalDeposits).toBe(100);
            expect(config.totalDepositAmount).toEqual(new Prisma.Decimal('5000000'));
        });
    });

    describe('update', () => {
        it('should return a new instance with updated fields', () => {
            const original = BankConfig.create(defaultParams);

            const updated = original.update({
                bankName: '신한은행',
                priority: 5,
                isActive: false,
            });

            // 원본은 변경되지 않음
            expect(original.bankName).toBe('KB국민은행');
            expect(original.priority).toBe(0);
            expect(original.isActive).toBe(true);

            // 새 인스턴스는 변경됨
            expect(updated.bankName).toBe('신한은행');
            expect(updated.priority).toBe(5);
            expect(updated.isActive).toBe(false);

            // 다른 필드는 유지
            expect(updated.accountNumber).toBe('123-456-7890');
            expect(updated.currency).toBe(ExchangeCurrencyCode.KRW);
        });

        it('should allow setting maxAmount to null', () => {
            const original = BankConfig.create({
                ...defaultParams,
                maxAmount: new Prisma.Decimal('1000000'),
            });

            const updated = original.update({ maxAmount: null });

            expect(original.maxAmount).toEqual(new Prisma.Decimal('1000000'));
            expect(updated.maxAmount).toBeNull();
        });
    });

    describe('softDelete', () => {
        it('should mark entity as deleted', () => {
            const config = BankConfig.create(defaultParams);

            expect(config.isDeleted()).toBe(false);

            config.softDelete();

            expect(config.isDeleted()).toBe(true);
            expect(config.deletedAt).toBeInstanceOf(Date);
        });
    });

    describe('toggleActive / activate / deactivate', () => {
        it('should toggle active state', () => {
            const config = BankConfig.create(defaultParams);
            expect(config.isActive).toBe(true);

            config.toggleActive();
            expect(config.isActive).toBe(false);

            config.toggleActive();
            expect(config.isActive).toBe(true);
        });

        it('should activate', () => {
            const config = BankConfig.create({ ...defaultParams, isActive: false });
            expect(config.isActive).toBe(false);

            config.activate();
            expect(config.isActive).toBe(true);
        });

        it('should deactivate', () => {
            const config = BankConfig.create(defaultParams);
            expect(config.isActive).toBe(true);

            config.deactivate();
            expect(config.isActive).toBe(false);
        });
    });

    describe('incrementDepositStats', () => {
        it('should increment deposit count and total amount', () => {
            const config = BankConfig.create(defaultParams);

            expect(config.totalDeposits).toBe(0);
            expect(config.totalDepositAmount).toEqual(new Prisma.Decimal(0));

            config.incrementDepositStats(new Prisma.Decimal('50000'));

            expect(config.totalDeposits).toBe(1);
            expect(config.totalDepositAmount).toEqual(new Prisma.Decimal('50000'));

            config.incrementDepositStats(new Prisma.Decimal('30000'));

            expect(config.totalDeposits).toBe(2);
            expect(config.totalDepositAmount).toEqual(new Prisma.Decimal('80000'));
        });
    });

    describe('amount validation', () => {
        it('isAmountAboveMinimum should return true when amount >= minAmount', () => {
            const config = BankConfig.create(defaultParams);

            expect(config.isAmountAboveMinimum(new Prisma.Decimal('10000'))).toBe(true);
            expect(config.isAmountAboveMinimum(new Prisma.Decimal('50000'))).toBe(true);
            expect(config.isAmountAboveMinimum(new Prisma.Decimal('9999'))).toBe(false);
        });

        it('isAmountBelowMaximum should return true when no max limit', () => {
            const config = BankConfig.create(defaultParams);

            expect(config.isAmountBelowMaximum(new Prisma.Decimal('999999999'))).toBe(true);
        });

        it('isAmountBelowMaximum should return true when amount <= maxAmount', () => {
            const config = BankConfig.create({
                ...defaultParams,
                maxAmount: new Prisma.Decimal('1000000'),
            });

            expect(config.isAmountBelowMaximum(new Prisma.Decimal('1000000'))).toBe(true);
            expect(config.isAmountBelowMaximum(new Prisma.Decimal('500000'))).toBe(true);
            expect(config.isAmountBelowMaximum(new Prisma.Decimal('1000001'))).toBe(false);
        });

        it('isAmountValid should check both min and max', () => {
            const config = BankConfig.create({
                ...defaultParams,
                maxAmount: new Prisma.Decimal('1000000'),
            });

            expect(config.isAmountValid(new Prisma.Decimal('50000'))).toBe(true);
            expect(config.isAmountValid(new Prisma.Decimal('9999'))).toBe(false);
            expect(config.isAmountValid(new Prisma.Decimal('1000001'))).toBe(false);
        });
    });

    describe('isAvailable', () => {
        it('should return true when active and not deleted', () => {
            const config = BankConfig.create(defaultParams);
            expect(config.isAvailable()).toBe(true);
        });

        it('should return false when inactive', () => {
            const config = BankConfig.create({ ...defaultParams, isActive: false });
            expect(config.isAvailable()).toBe(false);
        });

        it('should return false when deleted', () => {
            const config = BankConfig.create(defaultParams);
            config.softDelete();
            expect(config.isAvailable()).toBe(false);
        });
    });
});
