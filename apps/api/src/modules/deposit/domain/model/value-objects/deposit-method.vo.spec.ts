// src/modules/deposit/domain/model/value-objects/deposit-method.vo.spec.ts
import { DepositMethodType, PaymentProvider } from 'src/generated/prisma';
import { DepositMethod } from './deposit-method.vo';

describe('DepositMethod Value Object', () => {
    describe('create', () => {
        it('should create a crypto wallet deposit method', () => {
            const method = DepositMethod.create(
                DepositMethodType.CRYPTO_WALLET,
                PaymentProvider.NOWPAYMENT,
            );

            expect(method.methodType).toBe(DepositMethodType.CRYPTO_WALLET);
            expect(method.provider).toBe(PaymentProvider.NOWPAYMENT);
        });

        it('should create a bank transfer deposit method', () => {
            const method = DepositMethod.create(
                DepositMethodType.BANK_TRANSFER,
                PaymentProvider.MANUAL,
            );

            expect(method.methodType).toBe(DepositMethodType.BANK_TRANSFER);
            expect(method.provider).toBe(PaymentProvider.MANUAL);
        });
    });

    describe('fromPersistence', () => {
        it('should create from persistence data', () => {
            const method = DepositMethod.fromPersistence({
                methodType: DepositMethodType.CRYPTO_WALLET,
                provider: PaymentProvider.NOWPAYMENT,
            });

            expect(method.methodType).toBe(DepositMethodType.CRYPTO_WALLET);
            expect(method.provider).toBe(PaymentProvider.NOWPAYMENT);
        });
    });

    describe('toPersistence', () => {
        it('should convert to persistence format', () => {
            const method = DepositMethod.create(
                DepositMethodType.BANK_TRANSFER,
                PaymentProvider.MANUAL,
            );

            const persistence = method.toPersistence();

            expect(persistence).toEqual({
                methodType: DepositMethodType.BANK_TRANSFER,
                provider: PaymentProvider.MANUAL,
            });
        });
    });

    describe('isCryptoWallet', () => {
        it('should return true for crypto wallet method', () => {
            const method = DepositMethod.create(
                DepositMethodType.CRYPTO_WALLET,
                PaymentProvider.NOWPAYMENT,
            );

            expect(method.isCryptoWallet()).toBe(true);
            expect(method.isBankTransfer()).toBe(false);
        });
    });

    describe('isBankTransfer', () => {
        it('should return true for bank transfer method', () => {
            const method = DepositMethod.create(
                DepositMethodType.BANK_TRANSFER,
                PaymentProvider.MANUAL,
            );

            expect(method.isBankTransfer()).toBe(true);
            expect(method.isCryptoWallet()).toBe(false);
        });
    });

    describe('isManual', () => {
        it('should return true for manual provider', () => {
            const method = DepositMethod.create(
                DepositMethodType.BANK_TRANSFER,
                PaymentProvider.MANUAL,
            );

            expect(method.isManual()).toBe(true);
            expect(method.isNowPayment()).toBe(false);
        });
    });

    describe('isNowPayment', () => {
        it('should return true for nowpayment provider', () => {
            const method = DepositMethod.create(
                DepositMethodType.CRYPTO_WALLET,
                PaymentProvider.NOWPAYMENT,
            );

            expect(method.isNowPayment()).toBe(true);
            expect(method.isManual()).toBe(false);
        });
    });
});
