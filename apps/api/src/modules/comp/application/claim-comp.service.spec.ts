// src/modules/comp/application/claim-comp.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from '@prisma/client';
import { ClaimCompService } from './claim-comp.service';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompWallet, InsufficientCompBalanceException } from '../domain';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';
import { AdvisoryLockService } from 'src/common/concurrency';

describe('ClaimCompService', () => {
    let module: TestingModule;
    let service: ClaimCompService;
    let mockRepository: jest.Mocked<CompRepositoryPort>;
    let mockUpdateBalanceService: jest.Mocked<UpdateUserBalanceService>;
    let mockAnalyticsQueueService: jest.Mocked<AnalyticsQueueService>;
    let mockAdvisoryLockService: jest.Mocked<AdvisoryLockService>;

    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;

    const createMockWallet = (balance: number, totalUsed: number = 0): CompWallet => {
        return new CompWallet(
            BigInt(1),
            userId,
            currency,
            new Prisma.Decimal(balance),
            new Prisma.Decimal(100),
            new Prisma.Decimal(totalUsed),
            new Date(),
            new Date(),
        );
    };

    beforeEach(async () => {
        mockRepository = {
            findByUserIdAndCurrency: jest.fn(),
            save: jest.fn(),
            createTransaction: jest.fn(),
            createMainTransaction: jest.fn(),
            findTransactions: jest.fn(),
            getStatsOverview: jest.fn(),
            getDailyStats: jest.fn(),
            getTopEarners: jest.fn(),
        };

        mockUpdateBalanceService = {
            updateBalance: jest.fn().mockResolvedValue({
                cash: new Prisma.Decimal(150),
                bonus: new Prisma.Decimal(0),
            }),
        } as any;

        mockAnalyticsQueueService = {
            enqueueComp: jest.fn().mockResolvedValue(undefined),
        } as any;

        mockAdvisoryLockService = {
            acquireLock: jest.fn().mockResolvedValue(undefined),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                ClaimCompService,
                { provide: COMP_REPOSITORY, useValue: mockRepository },
                { provide: UpdateUserBalanceService, useValue: mockUpdateBalanceService },
                { provide: AnalyticsQueueService, useValue: mockAnalyticsQueueService },
                { provide: AdvisoryLockService, useValue: mockAdvisoryLockService },
            ],
        }).compile();

        service = module.get<ClaimCompService>(ClaimCompService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should claim comp successfully', async () => {
            const existingWallet = createMockWallet(100, 50);
            const savedWallet = createMockWallet(50, 100);

            mockRepository.findByUserIdAndCurrency.mockResolvedValue(existingWallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({ id: BigInt(10) } as any);
            mockRepository.createMainTransaction.mockResolvedValue(BigInt(1));

            const result = await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(50),
            });

            expect(result.claimedAmount).toEqual(new Prisma.Decimal(50));
            expect(result.newCompBalance).toEqual(new Prisma.Decimal(50));
            expect(mockAdvisoryLockService.acquireLock).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockRepository.createTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: CompTransactionType.CLAIM,
                    amount: new Prisma.Decimal(-50), // negated
                }),
            );
            expect(mockUpdateBalanceService.updateBalance).toHaveBeenCalled();
            expect(mockRepository.createMainTransaction).toHaveBeenCalled();
        });

        it('should throw error when wallet not found', async () => {
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(null);

            await expect(
                service.execute({
                    userId,
                    currency,
                    amount: new Prisma.Decimal(50),
                }),
            ).rejects.toThrow(InsufficientCompBalanceException);
        });

        it('should throw error when insufficient balance', async () => {
            const wallet = createMockWallet(30);

            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

            await expect(
                service.execute({
                    userId,
                    currency,
                    amount: new Prisma.Decimal(50),
                }),
            ).rejects.toThrow(InsufficientCompBalanceException);
        });

        it('should transfer comp amount to main cash balance', async () => {
            const wallet = createMockWallet(100);
            const savedWallet = createMockWallet(75, 25);

            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({ id: BigInt(10) } as any);
            mockRepository.createMainTransaction.mockResolvedValue(BigInt(1));

            await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(25),
            });

            expect(mockUpdateBalanceService.updateBalance).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    currency,
                    amount: new Prisma.Decimal(25),
                }),
            );
        });

        it('should enqueue analytics', async () => {
            const wallet = createMockWallet(100);
            const savedWallet = createMockWallet(80, 20);

            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({ id: BigInt(10) } as any);
            mockRepository.createMainTransaction.mockResolvedValue(BigInt(1));

            await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(20),
            });

            expect(mockAnalyticsQueueService.enqueueComp).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    currency,
                    convertedAmount: new Prisma.Decimal(20),
                }),
            );
        });
    });
});
