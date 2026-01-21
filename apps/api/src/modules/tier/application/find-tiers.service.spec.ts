// src/modules/tier/application/find-tiers.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from '@prisma/client';
import { FindTiersService } from './find-tiers.service';
import { TIER_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import { Tier } from '../domain';

describe('FindTiersService', () => {
    let module: TestingModule;
    let service: FindTiersService;
    let mockRepository: jest.Mocked<TierRepositoryPort>;

    const createMockTier = (code: string, priority: number): Tier => {
        return Tier.fromPersistence({
            id: BigInt(priority),
            uid: `tier-${code}`,
            priority,
            code,
            requirementUsd: new Prisma.Decimal(priority * 10000),
            levelUpBonusUsd: new Prisma.Decimal(0),
            compRate: new Prisma.Decimal(0),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockRepository = {
            findAll: jest.fn(), findByCode: jest.fn(), findByPriority: jest.fn(),
            findLowestPriority: jest.fn(), findById: jest.fn(), create: jest.fn(),
            update: jest.fn(), acquireGlobalLock: jest.fn(), saveTranslation: jest.fn(),
        };

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                FindTiersService,
                { provide: TIER_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<FindTiersService>(FindTiersService);
        jest.clearAllMocks();
    });

    afterEach(async () => { await module.close(); });

    describe('execute', () => {
        it('should return all tiers', async () => {
            const tiers = [
                createMockTier('BRONZE', 1),
                createMockTier('SILVER', 2),
                createMockTier('GOLD', 3),
            ];
            mockRepository.findAll.mockResolvedValue(tiers);

            const result = await service.execute();

            expect(result).toEqual(tiers);
            expect(result).toHaveLength(3);
            expect(mockRepository.findAll).toHaveBeenCalled();
        });

        it('should return empty array when no tiers', async () => {
            mockRepository.findAll.mockResolvedValue([]);

            const result = await service.execute();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });
    });
});
