// src/modules/comp/application/deduct-comp.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from 'src/generated/prisma';
import { DeductCompService } from './deduct-comp.service';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompWallet, CompNotFoundException, InsufficientCompBalanceException } from '../domain';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';

describe('DeductCompService', () => {
    let module: TestingModule;
    let service: DeductCompService;
    let mockRepository: jest.Mocked<CompRepositoryPort>;
    let mockAnalyticsQueueService: jest.Mocked<AnalyticsQueueService>;

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
            acquireLock: jest.fn(),
            createTransaction: jest.fn(),
            createMainTransaction: jest.fn(),
            findTransactions: jest.fn(),
            getStatsOverview: jest.fn(),
            getDailyStats: jest.fn(),
            getTopEarners: jest.fn(),
        };

        mockAnalyticsQueueService = {
            enqueueComp: jest.fn().mockResolvedValue(undefined),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                DeductCompService,
                { provide: COMP_REPOSITORY, useValue: mockRepository },
                { provide: AnalyticsQueueService, useValue: mockAnalyticsQueueService },
            ],
        }).compile();

        service = module.get<DeductCompService>(DeductCompService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should deduct comp successfully', async () => {
            const existingWallet = createMockWallet(100, 50);
            const savedWallet = createMockWallet(70, 80);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(existingWallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({} as any);

            const result = await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(30),
                description: 'Penalty deduction',
            });

            expect(result.balance).toEqual(new Prisma.Decimal(70));
            expect(mockRepository.acquireLock).toHaveBeenCalledWith(userId);
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockRepository.createTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: CompTransactionType.ADMIN,
                    amount: new Prisma.Decimal(-30), // negated
                    description: 'Penalty deduction',
                }),
            );
        });

        it('should throw CompNotFoundException when wallet not found', async () => {
            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(null);

            await expect(
                service.execute({
                    userId,
                    currency,
                    amount: new Prisma.Decimal(50),
                }),
            ).rejects.toThrow(CompNotFoundException);
        });

        it('should throw InsufficientCompBalanceException when balance insufficient', async () => {
            const wallet = createMockWallet(30);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

            await expect(
                service.execute({
                    userId,
                    currency,
                    amount: new Prisma.Decimal(50),
                }),
            ).rejects.toThrow(InsufficientCompBalanceException);
        });

        it('should use default description when not provided', async () => {
            const wallet = createMockWallet(100);
            const savedWallet = createMockWallet(80, 20);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({} as any);

            await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(20),
            });

            expect(mockRepository.createTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: 'Admin Deduction',
                }),
            );
        });

        it('should enqueue analytics', async () => {
            const wallet = createMockWallet(100);
            const savedWallet = createMockWallet(60, 40);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({} as any);

            await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(40),
            });

            expect(mockAnalyticsQueueService.enqueueComp).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    currency,
                    deductedAmount: new Prisma.Decimal(40),
                }),
            );
        });
    });
});
