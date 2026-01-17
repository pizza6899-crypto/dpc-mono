// src/modules/deposit/domain/model/deposit-detail.entity.spec.ts
import {
    Prisma,
    DepositDetailStatus,
    DepositMethodType,
    PaymentProvider,
    ExchangeCurrencyCode,
    FeePaidByType,
} from 'src/generated/prisma';
import { DepositDetail } from './deposit-detail.entity';
import { DepositMethod } from './value-objects/deposit-method.vo';
import { DepositAmount } from './value-objects/deposit-amount.vo';
import { DepositAlreadyProcessedException, DepositException } from '../deposit.exception';

describe('DepositDetail Entity', () => {
    const userId = BigInt(100);
    const adminId = BigInt(1);
    const currency = ExchangeCurrencyCode.USDT;

    const createDepositMethod = () =>
        DepositMethod.create(DepositMethodType.CRYPTO_WALLET, PaymentProvider.NOWPAYMENT);

    const createDepositAmount = (requestedAmount = 100) =>
        DepositAmount.create({ requestedAmount: new Prisma.Decimal(requestedAmount) });

    describe('create', () => {
        it('should create a new deposit with required fields', () => {
            const deposit = DepositDetail.create({
                uid: 'dep-uid-123',
                userId,
                depositCurrency: currency,
                method: createDepositMethod(),
                amount: createDepositAmount(100),
            });

            expect(deposit.id).toBeNull();
            expect(deposit.uid).toBe('dep-uid-123');
            expect(deposit.userId).toBe(userId);
            expect(deposit.depositCurrency).toBe(currency);
            expect(deposit.status).toBe(DepositDetailStatus.PENDING);
            expect(deposit.transactionId).toBeNull();
            expect(deposit.createdAt).toBeInstanceOf(Date);
        });

        it('should create a deposit with optional fields', () => {
            const deposit = DepositDetail.create({
                uid: 'dep-uid-123',
                userId,
                depositCurrency: currency,
                method: createDepositMethod(),
                amount: createDepositAmount(100),
                walletAddress: '0x1234567890abcdef',
                depositNetwork: 'TRC20',
                promotionId: BigInt(5),
                ipAddress: '192.168.1.1',
            });

            expect(deposit.walletAddress).toBe('0x1234567890abcdef');
            expect(deposit.depositNetwork).toBe('TRC20');
            expect(deposit.promotionId).toBe(BigInt(5));
            expect(deposit.ipAddress).toBe('192.168.1.1');
        });
    });

    describe('fromPersistence', () => {
        it('should create entity from persistence data', () => {
            const now = new Date();
            const deposit = DepositDetail.fromPersistence({
                id: BigInt(1),
                uid: 'dep-uid-123',
                userId,
                transactionId: BigInt(10),
                status: DepositDetailStatus.COMPLETED,
                methodType: DepositMethodType.CRYPTO_WALLET,
                provider: PaymentProvider.NOWPAYMENT,
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: new Prisma.Decimal(100),
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: currency,
                walletAddress: '0x123',
                walletAddressExtraId: null,
                depositNetwork: 'TRC20',
                depositorName: null,
                providerPaymentId: 'np-123',
                transactionHash: 'hash-abc',
                bankConfigId: null,
                cryptoConfigId: BigInt(1),
                promotionId: null,
                processedBy: adminId,
                adminNote: 'Approved',
                ipAddress: '192.168.1.1',
                deviceFingerprint: null,
                failureReason: null,
                providerMetadata: { test: 'data' },
                createdAt: now,
                updatedAt: now,
                confirmedAt: now,
                failedAt: null,
            });

            expect(deposit.id).toBe(BigInt(1));
            expect(deposit.status).toBe(DepositDetailStatus.COMPLETED);
            expect(deposit.transactionId).toBe(BigInt(10));
            expect(deposit.processedBy).toBe(adminId);
        });
    });

    describe('status checks', () => {
        const createDepositWithStatus = (status: DepositDetailStatus) => {
            return DepositDetail.fromPersistence({
                id: BigInt(1),
                uid: 'dep-uid-123',
                userId,
                transactionId: null,
                status,
                methodType: DepositMethodType.CRYPTO_WALLET,
                provider: PaymentProvider.NOWPAYMENT,
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: null,
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: currency,
                walletAddress: null,
                walletAddressExtraId: null,
                depositNetwork: null,
                depositorName: null,
                providerPaymentId: null,
                transactionHash: null,
                bankConfigId: null,
                cryptoConfigId: null,
                promotionId: null,
                processedBy: null,
                adminNote: null,
                ipAddress: null,
                deviceFingerprint: null,
                failureReason: null,
                providerMetadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                confirmedAt: null,
                failedAt: null,
            });
        };

        it('should correctly identify PENDING status', () => {
            const deposit = createDepositWithStatus(DepositDetailStatus.PENDING);
            expect(deposit.isPending()).toBe(true);
            expect(deposit.canBeProcessed()).toBe(true);
            expect(deposit.isProcessed()).toBe(false);
        });

        it('should correctly identify CONFIRMING status', () => {
            const deposit = createDepositWithStatus(DepositDetailStatus.CONFIRMING);
            expect(deposit.isConfirming()).toBe(true);
            expect(deposit.canBeProcessed()).toBe(true);
        });

        it('should correctly identify COMPLETED status', () => {
            const deposit = createDepositWithStatus(DepositDetailStatus.COMPLETED);
            expect(deposit.isCompleted()).toBe(true);
            expect(deposit.canBeProcessed()).toBe(false);
            expect(deposit.isProcessed()).toBe(true);
        });

        it('should correctly identify FAILED status', () => {
            const deposit = createDepositWithStatus(DepositDetailStatus.FAILED);
            expect(deposit.isFailed()).toBe(true);
            expect(deposit.canBeProcessed()).toBe(false);
            expect(deposit.isProcessed()).toBe(true);
        });

        it('should correctly identify CANCELLED status', () => {
            const deposit = createDepositWithStatus(DepositDetailStatus.CANCELLED);
            expect(deposit.isCancelled()).toBe(true);
            expect(deposit.isProcessed()).toBe(true);
        });

        it('should correctly identify REJECTED status', () => {
            const deposit = createDepositWithStatus(DepositDetailStatus.REJECTED);
            expect(deposit.isRejected()).toBe(true);
            expect(deposit.isProcessed()).toBe(true);
        });

        it('should correctly identify EXPIRED status', () => {
            const deposit = createDepositWithStatus(DepositDetailStatus.EXPIRED);
            expect(deposit.isExpired()).toBe(true);
        });
    });

    describe('approve', () => {
        const createPendingDeposit = () => {
            return DepositDetail.fromPersistence({
                id: BigInt(1),
                uid: 'dep-uid-123',
                userId,
                transactionId: null,
                status: DepositDetailStatus.PENDING,
                methodType: DepositMethodType.CRYPTO_WALLET,
                provider: PaymentProvider.NOWPAYMENT,
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: null,
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: currency,
                walletAddress: '0x123',
                walletAddressExtraId: null,
                depositNetwork: 'TRC20',
                depositorName: null,
                providerPaymentId: null,
                transactionHash: null,
                bankConfigId: null,
                cryptoConfigId: BigInt(1),
                promotionId: null,
                processedBy: null,
                adminNote: null,
                ipAddress: null,
                deviceFingerprint: null,
                failureReason: null,
                providerMetadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                confirmedAt: null,
                failedAt: null,
            });
        };

        it('should approve a pending deposit', () => {
            const deposit = createPendingDeposit();

            deposit.approve(
                new Prisma.Decimal(100),
                adminId,
                'hash-abc',
                'Approved by admin',
                BigInt(50),
            );

            expect(deposit.status).toBe(DepositDetailStatus.COMPLETED);
            expect(deposit.getAmount().actuallyPaid).toEqual(new Prisma.Decimal(100));
            expect(deposit.transactionHash).toBe('hash-abc');
            expect(deposit.adminNote).toBe('Approved by admin');
            expect(deposit.processedBy).toBe(adminId);
            expect(deposit.transactionId).toBe(BigInt(50));
            expect(deposit.confirmedAt).toBeInstanceOf(Date);
        });

        it('should throw error when approving already processed deposit', () => {
            const deposit = DepositDetail.fromPersistence({
                id: BigInt(1),
                uid: 'dep-uid-123',
                userId,
                transactionId: null,
                status: DepositDetailStatus.COMPLETED,
                methodType: DepositMethodType.CRYPTO_WALLET,
                provider: PaymentProvider.NOWPAYMENT,
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: new Prisma.Decimal(100),
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: currency,
                walletAddress: null,
                walletAddressExtraId: null,
                depositNetwork: null,
                depositorName: null,
                providerPaymentId: null,
                transactionHash: null,
                bankConfigId: null,
                cryptoConfigId: null,
                promotionId: null,
                processedBy: adminId,
                adminNote: null,
                ipAddress: null,
                deviceFingerprint: null,
                failureReason: null,
                providerMetadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                confirmedAt: new Date(),
                failedAt: null,
            });

            expect(() => deposit.approve(new Prisma.Decimal(100), adminId)).toThrow(
                DepositAlreadyProcessedException,
            );
        });

        it('should throw error when entity is not persisted', () => {
            const deposit = DepositDetail.create({
                uid: 'dep-uid-123',
                userId,
                depositCurrency: currency,
                method: createDepositMethod(),
                amount: createDepositAmount(100),
            });

            expect(() => deposit.approve(new Prisma.Decimal(100), adminId)).toThrow(
                DepositException,
            );
        });
    });

    describe('reject', () => {
        const createPendingDeposit = () => {
            return DepositDetail.fromPersistence({
                id: BigInt(1),
                uid: 'dep-uid-123',
                userId,
                transactionId: null,
                status: DepositDetailStatus.PENDING,
                methodType: DepositMethodType.BANK_TRANSFER,
                provider: PaymentProvider.MANUAL,
                requestedAmount: new Prisma.Decimal(500),
                actuallyPaid: null,
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: currency,
                walletAddress: null,
                walletAddressExtraId: null,
                depositNetwork: null,
                depositorName: 'John Doe',
                providerPaymentId: null,
                transactionHash: null,
                bankConfigId: BigInt(1),
                cryptoConfigId: null,
                promotionId: null,
                processedBy: null,
                adminNote: null,
                ipAddress: null,
                deviceFingerprint: null,
                failureReason: null,
                providerMetadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                confirmedAt: null,
                failedAt: null,
            });
        };

        it('should reject a pending deposit', () => {
            const deposit = createPendingDeposit();

            deposit.reject('Suspicious activity detected', adminId);

            expect(deposit.status).toBe(DepositDetailStatus.REJECTED);
            expect(deposit.failureReason).toBe('Suspicious activity detected');
            expect(deposit.processedBy).toBe(adminId);
            expect(deposit.failedAt).toBeInstanceOf(Date);
        });

        it('should throw error when rejecting already processed deposit', () => {
            const deposit = DepositDetail.fromPersistence({
                id: BigInt(1),
                uid: 'dep-uid-123',
                userId,
                transactionId: null,
                status: DepositDetailStatus.REJECTED,
                methodType: DepositMethodType.BANK_TRANSFER,
                provider: PaymentProvider.MANUAL,
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: null,
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: currency,
                walletAddress: null,
                walletAddressExtraId: null,
                depositNetwork: null,
                depositorName: null,
                providerPaymentId: null,
                transactionHash: null,
                bankConfigId: null,
                cryptoConfigId: null,
                promotionId: null,
                processedBy: adminId,
                adminNote: null,
                ipAddress: null,
                deviceFingerprint: null,
                failureReason: 'Already rejected',
                providerMetadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                confirmedAt: null,
                failedAt: new Date(),
            });

            expect(() => deposit.reject('New reason', adminId)).toThrow(
                DepositAlreadyProcessedException,
            );
        });
    });

    describe('utility methods', () => {
        it('hasWalletAddress should return true when address exists', () => {
            const deposit = DepositDetail.create({
                uid: 'dep-uid-123',
                userId,
                depositCurrency: currency,
                method: createDepositMethod(),
                amount: createDepositAmount(100),
                walletAddress: '0x123456',
            });

            expect(deposit.hasWalletAddress()).toBe(true);
        });

        it('hasWalletAddress should return false when address is null', () => {
            const deposit = DepositDetail.create({
                uid: 'dep-uid-123',
                userId,
                depositCurrency: currency,
                method: createDepositMethod(),
                amount: createDepositAmount(100),
            });

            expect(deposit.hasWalletAddress()).toBe(false);
        });

        it('isProcessedByAdmin should return true when processedBy is set', () => {
            const deposit = DepositDetail.fromPersistence({
                id: BigInt(1),
                uid: 'dep-uid-123',
                userId,
                transactionId: null,
                status: DepositDetailStatus.COMPLETED,
                methodType: DepositMethodType.CRYPTO_WALLET,
                provider: PaymentProvider.NOWPAYMENT,
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: new Prisma.Decimal(100),
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: currency,
                walletAddress: null,
                walletAddressExtraId: null,
                depositNetwork: null,
                depositorName: null,
                providerPaymentId: null,
                transactionHash: null,
                bankConfigId: null,
                cryptoConfigId: null,
                promotionId: null,
                processedBy: adminId,
                adminNote: null,
                ipAddress: null,
                deviceFingerprint: null,
                failureReason: null,
                providerMetadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                confirmedAt: new Date(),
                failedAt: null,
            });

            expect(deposit.isProcessedByAdmin()).toBe(true);
        });
    });
});
