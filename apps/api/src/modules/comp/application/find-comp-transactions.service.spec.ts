// src/modules/comp/application/find-comp-transactions.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ExchangeCurrencyCode, Prisma, CompTransactionType } from '@repo/database';
import { FindCompTransactionsService } from './find-comp-transactions.service';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompTransaction } from '../domain';

describe('FindCompTransactionsService', () => {
    let module: TestingModule;
    let service: FindCompTransactionsService;
    let mockRepository: jest.Mocked<CompRepositoryPort>;

    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;

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

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                FindCompTransactionsService,
                { provide: COMP_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<FindCompTransactionsService>(FindCompTransactionsService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should return paginated transactions', async () => {
            const transactions = [
                CompTransaction.create({
                    id: BigInt(1),
                    compWalletId: BigInt(1),
                    amount: new Prisma.Decimal(50),
                    balanceAfter: new Prisma.Decimal(50),
                    type: CompTransactionType.EARN,
                }),
                CompTransaction.create({
                    id: BigInt(2),
                    compWalletId: BigInt(1),
                    amount: new Prisma.Decimal(-20),
                    balanceAfter: new Prisma.Decimal(30),
                    type: CompTransactionType.CLAIM,
                }),
            ];

            mockRepository.findTransactions.mockResolvedValue({
                data: transactions,
                total: 2,
            });

            const result = await service.execute({
                userId,
                page: 1,
                limit: 10,
            });

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should pass filter parameters to repository', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            mockRepository.findTransactions.mockResolvedValue({
                data: [],
                total: 0,
            });

            await service.execute({
                userId,
                currency,
                startDate,
                endDate,
                page: 2,
                limit: 20,
            });

            expect(mockRepository.findTransactions).toHaveBeenCalledWith({
                userId,
                currency,
                startDate,
                endDate,
                page: 2,
                limit: 20,
            });
        });

        it('should return empty result when no transactions', async () => {
            mockRepository.findTransactions.mockResolvedValue({
                data: [],
                total: 0,
            });

            const result = await service.execute({
                userId,
                page: 1,
                limit: 10,
            });

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });
    });
});
