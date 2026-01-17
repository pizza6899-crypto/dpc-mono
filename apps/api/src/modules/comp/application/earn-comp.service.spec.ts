// src/modules/comp/application/earn-comp.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from 'src/generated/prisma';
import { EarnCompService } from './earn-comp.service';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompWallet } from '../domain';
import { AnalyticsQueueService } from '../../analytics/application/analytics-queue.service';

describe('EarnCompService', () => {
    let module: TestingModule;
    let service: EarnCompService;
    let mockRepository: jest.Mocked<CompRepositoryPort>;
    let mockAnalyticsQueueService: jest.Mocked<AnalyticsQueueService>;

    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;

    const createMockWallet = (balance: number = 0, totalEarned: number = 0): CompWallet => {
        return new CompWallet(
            BigInt(1),
            userId,
            currency,
            new Prisma.Decimal(balance),
            new Prisma.Decimal(totalEarned),
            new Prisma.Decimal(0),
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
                EarnCompService,
                { provide: COMP_REPOSITORY, useValue: mockRepository },
                { provide: AnalyticsQueueService, useValue: mockAnalyticsQueueService },
            ],
        }).compile();

        service = module.get<EarnCompService>(EarnCompService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should earn comp to existing wallet', async () => {
            const existingWallet = createMockWallet(50, 100);
            const savedWallet = createMockWallet(80, 130);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(existingWallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({} as any);

            const result = await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(30),
                referenceId: 'round-123',
                description: 'Game comp',
            });

            expect(result.balance).toEqual(new Prisma.Decimal(80));
            expect(mockRepository.acquireLock).toHaveBeenCalledWith(userId);
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockRepository.createTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: CompTransactionType.EARN,
                    amount: new Prisma.Decimal(30),
                }),
            );
            expect(mockAnalyticsQueueService.enqueueComp).toHaveBeenCalled();
        });

        it('should create new wallet when not exists', async () => {
            const savedWallet = createMockWallet(50, 50);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(null);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({} as any);

            const result = await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(50),
            });

            expect(result).toBeDefined();
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should record transaction with referenceId and description', async () => {
            const wallet = createMockWallet(0, 0);
            const savedWallet = createMockWallet(100, 100);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({} as any);

            await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(100),
                referenceId: 'game-round-456',
                description: 'Slot game earnings',
            });

            expect(mockRepository.createTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    referenceId: 'game-round-456',
                    description: 'Slot game earnings',
                }),
            );
        });

        it('should enqueue analytics', async () => {
            const wallet = createMockWallet(0, 0);
            const savedWallet = createMockWallet(25, 25);

            mockRepository.acquireLock.mockResolvedValue(undefined);
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
            mockRepository.save.mockResolvedValue(savedWallet);
            mockRepository.createTransaction.mockResolvedValue({} as any);

            await service.execute({
                userId,
                currency,
                amount: new Prisma.Decimal(25),
            });

            expect(mockAnalyticsQueueService.enqueueComp).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    currency,
                    earnedAmount: new Prisma.Decimal(25),
                }),
            );
        });
    });
});
