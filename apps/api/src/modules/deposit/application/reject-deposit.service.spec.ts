// src/modules/deposit/application/reject-deposit.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import {
    Prisma,
    DepositDetailStatus,
    DepositMethodType,
    PaymentProvider,
    ExchangeCurrencyCode,
} from '@repo/database';
import { RejectDepositService } from './reject-deposit.service';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositDetail, DepositAlreadyProcessedException } from '../domain';

describe('RejectDepositService', () => {
    let module: TestingModule;
    let service: RejectDepositService;
    let mockRepository: jest.Mocked<DepositDetailRepositoryPort>;

    const userId = BigInt(100);
    const adminId = BigInt(1);
    const depositId = BigInt(10);

    const createPendingDeposit = (): DepositDetail => {
        return DepositDetail.fromPersistence({
            id: depositId,
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
            depositCurrency: ExchangeCurrencyCode.USDT,
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

    beforeEach(async () => {
        mockRepository = {
            findById: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            createTransaction: jest.fn(),
            getTransactionUserId: jest.fn(),
            listByUserId: jest.fn(),
            findByUidAndUserId: jest.fn(),
            existsPendingByUserId: jest.fn(),
            acquireUserLock: jest.fn(),
            acquireDepositLock: jest.fn(),
        };

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                RejectDepositService,
                { provide: DEPOSIT_DETAIL_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<RejectDepositService>(RejectDepositService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should reject deposit successfully', async () => {
            const deposit = createPendingDeposit();

            mockRepository.acquireDepositLock.mockResolvedValue(undefined);
            mockRepository.getById.mockResolvedValue(deposit);
            mockRepository.update.mockResolvedValue(deposit);

            const result = await service.execute({
                id: depositId,
                failureReason: 'Suspicious activity',
                adminId,
                requestInfo: {} as any,
            });

            expect(result.userId).toBe(userId.toString());
            expect(mockRepository.acquireDepositLock).toHaveBeenCalledWith(depositId);
            expect(mockRepository.update).toHaveBeenCalled();

            // Verify deposit state was changed
            expect(deposit.status).toBe(DepositDetailStatus.REJECTED);
            expect(deposit.failureReason).toBe('Suspicious activity');
            expect(deposit.processedBy).toBe(adminId);
        });

        it('should throw error when deposit already processed', async () => {
            const completedDeposit = DepositDetail.fromPersistence({
                id: depositId,
                uid: 'dep-uid-123',
                userId,
                transactionId: BigInt(50),
                status: DepositDetailStatus.COMPLETED,
                methodType: DepositMethodType.CRYPTO_WALLET,
                provider: PaymentProvider.NOWPAYMENT,
                requestedAmount: new Prisma.Decimal(100),
                actuallyPaid: new Prisma.Decimal(100),
                feeAmount: null,
                feeCurrency: null,
                feePaidBy: null,
                depositCurrency: ExchangeCurrencyCode.USDT,
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

            mockRepository.acquireDepositLock.mockResolvedValue(undefined);
            mockRepository.getById.mockResolvedValue(completedDeposit);

            await expect(
                service.execute({
                    id: depositId,
                    failureReason: 'Test reason',
                    adminId,
                    requestInfo: {} as any,
                }),
            ).rejects.toThrow(DepositAlreadyProcessedException);
        });

        it('should acquire lock before processing', async () => {
            const deposit = createPendingDeposit();

            mockRepository.acquireDepositLock.mockResolvedValue(undefined);
            mockRepository.getById.mockResolvedValue(deposit);
            mockRepository.update.mockResolvedValue(deposit);

            await service.execute({
                id: depositId,
                failureReason: 'Reason',
                adminId,
                requestInfo: {} as any,
            });


            expect(mockRepository.acquireDepositLock).toHaveBeenCalledWith(depositId);
            expect(mockRepository.getById).toHaveBeenCalledWith(depositId, { transaction: true });
        });
    });
});
