// src/modules/deposit/application/approve-deposit.service.spec.ts
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
} from 'src/generated/prisma';
import { ApproveDepositService } from './approve-deposit.service';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositDetail } from '../domain';
import { DepositMethod } from '../domain/model/value-objects/deposit-method.vo';
import { DepositAmount } from '../domain/model/value-objects/deposit-amount.vo';
import { DepositAlreadyProcessedException } from '../domain';
import { UpdateUserBalanceAdminService } from '../../wallet/application/update-user-balance-admin.service';
import { GrantPromotionBonusService } from '../../promotion/application/grant-promotion-bonus.service';
import { CreateWageringRequirementService } from '../../wagering/application/create-wagering-requirement.service';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';

describe('ApproveDepositService', () => {
    let module: TestingModule;
    let service: ApproveDepositService;
    let mockRepository: jest.Mocked<DepositDetailRepositoryPort>;
    let mockUpdateBalanceService: jest.Mocked<UpdateUserBalanceAdminService>;
    let mockGrantPromotionService: jest.Mocked<GrantPromotionBonusService>;
    let mockWageringService: jest.Mocked<CreateWageringRequirementService>;
    let mockAnalyticsQueue: jest.Mocked<AnalyticsQueueService>;

    const userId = BigInt(100);
    const adminId = BigInt(1);
    const depositId = BigInt(10);

    const createPendingDeposit = (promotionId: bigint | null = null): DepositDetail => {
        return DepositDetail.fromPersistence({
            id: depositId,
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
            depositCurrency: ExchangeCurrencyCode.USDT,
            walletAddress: '0x123',
            walletAddressExtraId: null,
            depositNetwork: 'TRC20',
            depositorName: null,
            providerPaymentId: null,
            transactionHash: null,
            bankConfigId: null,
            cryptoConfigId: BigInt(1),
            promotionId,
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

        mockUpdateBalanceService = {
            execute: jest.fn().mockResolvedValue({
                beforeMainBalance: new Prisma.Decimal(0),
                afterMainBalance: new Prisma.Decimal(100),
                mainBalanceChange: new Prisma.Decimal(100),
            }),
        } as any;

        mockGrantPromotionService = {
            execute: jest.fn().mockResolvedValue({
                bonusAmount: new Prisma.Decimal(20),
            }),
        } as any;

        mockWageringService = {
            execute: jest.fn().mockResolvedValue({}),
        } as any;

        mockAnalyticsQueue = {
            enqueueDeposit: jest.fn().mockResolvedValue(undefined),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                ApproveDepositService,
                { provide: DEPOSIT_DETAIL_REPOSITORY, useValue: mockRepository },
                { provide: UpdateUserBalanceAdminService, useValue: mockUpdateBalanceService },
                { provide: GrantPromotionBonusService, useValue: mockGrantPromotionService },
                { provide: CreateWageringRequirementService, useValue: mockWageringService },
                { provide: AnalyticsQueueService, useValue: mockAnalyticsQueue },
            ],
        }).compile();

        service = module.get<ApproveDepositService>(ApproveDepositService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should approve deposit successfully', async () => {
            const deposit = createPendingDeposit();
            const transactionId = BigInt(50);

            mockRepository.acquireDepositLock.mockResolvedValue(undefined);
            mockRepository.getById.mockResolvedValue(deposit);
            mockRepository.createTransaction.mockResolvedValue(transactionId);
            mockRepository.update.mockResolvedValue(deposit);

            const result = await service.execute({
                id: depositId,
                actuallyPaid: new Prisma.Decimal(100),
                transactionHash: 'hash-abc',
                memo: 'Approved',
                adminId,
                requestInfo: {} as any,
            });

            expect(result.transactionId).toBe(transactionId.toString());
            expect(result.actuallyPaid).toBe('100');
            expect(mockRepository.acquireDepositLock).toHaveBeenCalledWith(depositId);
            expect(mockUpdateBalanceService.execute).toHaveBeenCalled();
            expect(mockRepository.createTransaction).toHaveBeenCalled();
            expect(mockRepository.update).toHaveBeenCalled();
            expect(mockAnalyticsQueue.enqueueDeposit).toHaveBeenCalled();
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
                    actuallyPaid: new Prisma.Decimal(100),
                    transactionHash: undefined,
                    memo: undefined,
                    adminId,
                    requestInfo: {} as any,
                }),
            ).rejects.toThrow(DepositAlreadyProcessedException);
        });

        it('should grant promotion bonus when promotionId exists', async () => {
            const deposit = createPendingDeposit(BigInt(5));

            mockRepository.acquireDepositLock.mockResolvedValue(undefined);
            mockRepository.getById.mockResolvedValue(deposit);
            mockRepository.createTransaction.mockResolvedValue(BigInt(50));
            mockRepository.update.mockResolvedValue(deposit);

            const result = await service.execute({
                id: depositId,
                actuallyPaid: new Prisma.Decimal(100),
                transactionHash: undefined,
                memo: undefined,
                adminId,
                requestInfo: {} as any,
            });

            expect(result.bonusAmount).toBe('20');
            expect(mockGrantPromotionService.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    promotionId: BigInt(5),
                    depositAmount: new Prisma.Decimal(100),
                }),
            );
            expect(mockWageringService.execute).not.toHaveBeenCalled();
        });

        it('should create wagering requirement when no promotionId', async () => {
            const deposit = createPendingDeposit(null);

            mockRepository.acquireDepositLock.mockResolvedValue(undefined);
            mockRepository.getById.mockResolvedValue(deposit);
            mockRepository.createTransaction.mockResolvedValue(BigInt(50));
            mockRepository.update.mockResolvedValue(deposit);

            await service.execute({
                id: depositId,
                actuallyPaid: new Prisma.Decimal(100),
                transactionHash: undefined,
                memo: undefined,
                adminId,
                requestInfo: {} as any,
            });

            expect(mockWageringService.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    sourceType: 'DEPOSIT',
                    requiredAmount: new Prisma.Decimal(100),
                }),
            );
            expect(mockGrantPromotionService.execute).not.toHaveBeenCalled();
        });
    });
});
