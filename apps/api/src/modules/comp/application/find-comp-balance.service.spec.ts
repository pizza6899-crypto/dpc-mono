// src/modules/comp/application/find-comp-balance.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { FindCompBalanceService } from './find-comp-balance.service';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';
import { CompWallet } from '../domain';

describe('FindCompBalanceService', () => {
    let module: TestingModule;
    let service: FindCompBalanceService;
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
                FindCompBalanceService,
                { provide: COMP_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<FindCompBalanceService>(FindCompBalanceService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should return existing wallet', async () => {
            const wallet = new CompWallet(
                BigInt(1),
                userId,
                currency,
                new Prisma.Decimal(150),
                new Prisma.Decimal(200),
                new Prisma.Decimal(50),
                new Date(),
                new Date(),
            );

            mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

            const result = await service.execute(userId, currency);

            expect(result).toBe(wallet);
            expect(result.balance).toEqual(new Prisma.Decimal(150));
            expect(mockRepository.findByUserIdAndCurrency).toHaveBeenCalledWith(userId, currency);
        });

        it('should return empty wallet when not found', async () => {
            mockRepository.findByUserIdAndCurrency.mockResolvedValue(null);

            const result = await service.execute(userId, currency);

            expect(result.userId).toBe(userId);
            expect(result.currency).toBe(currency);
            expect(result.balance).toEqual(new Prisma.Decimal(0));
            expect(result.totalEarned).toEqual(new Prisma.Decimal(0));
            expect(result.totalUsed).toEqual(new Prisma.Decimal(0));
        });
    });
});
