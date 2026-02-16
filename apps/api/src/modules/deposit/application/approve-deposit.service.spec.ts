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
} from '@prisma/client';
import { ApproveDepositService } from './approve-deposit.service';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositDetail } from '../domain';
import { DepositAlreadyProcessedException } from '../domain';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { FindUserWalletService } from '../../wallet/application/find-user-wallet.service';
import { GrantPromotionBonusService } from '../../promotion/application/grant-promotion-bonus.service';
import { CreateWageringRequirementService } from '../../wagering/requirement/application/create-wagering-requirement.service';
import { AdvisoryLockService } from 'src/common/concurrency';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { AccumulateUserDepositService } from 'src/modules/tier/evaluator/application/accumulate-user-deposit.service';

describe('ApproveDepositService', () => {
    let module: TestingModule;
    let service: ApproveDepositService;
    let mockRepository: jest.Mocked<DepositDetailRepositoryPort>;
    let mockFindWalletService: jest.Mocked<FindUserWalletService>;
    let mockUpdateBalanceService: jest.Mocked<UpdateUserBalanceService>;
    let mockGrantPromotionService: jest.Mocked<GrantPromotionBonusService>;
    let mockWageringService: jest.Mocked<CreateWageringRequirementService>;
    let mockAdvisoryLockService: jest.Mocked<AdvisoryLockService>;
    let mockExchangeRateService: jest.Mocked<ExchangeRateService>;
    let mockAccumulateDepositService: jest.Mocked<AccumulateUserDepositService>;

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
        } as any;

        mockFindWalletService = {
            findWallet: jest.fn().mockResolvedValue({
                cash: new Prisma.Decimal(100),
                bonus: new Prisma.Decimal(0),
            }),
        } as any;

        mockUpdateBalanceService = {
            updateBalance: jest.fn().mockResolvedValue({
                cash: new Prisma.Decimal(200),
                bonus: new Prisma.Decimal(0),
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

        mockAdvisoryLockService = {
            acquireLock: jest.fn().mockResolvedValue(undefined),
            releaseLock: jest.fn().mockResolvedValue(undefined),
        } as any;

        mockExchangeRateService = {
            getRate: jest.fn().mockResolvedValue(new Prisma.Decimal(1)),
        } as any;

        mockAccumulateDepositService = {
            execute: jest.fn().mockResolvedValue(undefined),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                ApproveDepositService,
                { provide: DEPOSIT_DETAIL_REPOSITORY, useValue: mockRepository },
                { provide: FindUserWalletService, useValue: mockFindWalletService },
                { provide: UpdateUserBalanceService, useValue: mockUpdateBalanceService },
                { provide: GrantPromotionBonusService, useValue: mockGrantPromotionService },
                { provide: CreateWageringRequirementService, useValue: mockWageringService },
                { provide: AdvisoryLockService, useValue: mockAdvisoryLockService },
                { provide: ExchangeRateService, useValue: mockExchangeRateService },
                { provide: AccumulateUserDepositService, useValue: mockAccumulateDepositService },
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

            mockAdvisoryLockService.acquireLock.mockResolvedValue(undefined);
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
            expect(mockAdvisoryLockService.acquireLock).toHaveBeenCalled();
            expect(mockUpdateBalanceService.updateBalance).toHaveBeenCalled();
            expect(mockRepository.createTransaction).toHaveBeenCalled();
            expect(mockRepository.update).toHaveBeenCalled();
            expect(mockAccumulateDepositService.execute).toHaveBeenCalled();
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

            mockAdvisoryLockService.acquireLock.mockResolvedValue(undefined);
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

            mockAdvisoryLockService.acquireLock.mockResolvedValue(undefined);
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

            mockAdvisoryLockService.acquireLock.mockResolvedValue(undefined);
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
                    principalAmount: new Prisma.Decimal(100),
                    multiplier: new Prisma.Decimal(1),
                    initialLockedCash: new Prisma.Decimal(100),
                    grantedBonusAmount: new Prisma.Decimal(0),
                }),
            );
            expect(mockGrantPromotionService.execute).not.toHaveBeenCalled();
        });
    });
});
