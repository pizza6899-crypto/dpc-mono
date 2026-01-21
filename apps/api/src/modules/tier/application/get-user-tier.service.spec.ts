// src/modules/tier/application/get-user-tier.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from '@prisma/client';
import { GetUserTierService } from './get-user-tier.service';
import { USER_TIER_REPOSITORY } from '../ports/repository.token';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { UserTier } from '../domain';

describe('GetUserTierService', () => {
    let module: TestingModule;
    let service: GetUserTierService;
    let mockRepository: jest.Mocked<UserTierRepositoryPort>;

    const userId = BigInt(100);

    const createMockUserTier = (): UserTier => {
        return UserTier.fromPersistence({
            id: BigInt(1),
            uid: 'user-tier-uid',
            userId,
            tierId: BigInt(2),
            totalRollingUsd: new Prisma.Decimal(15000),
            highestPromotedPriority: 2,
            isManualLock: false,
            lastPromotedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockRepository = {
            findByUserId: jest.fn(), findByUid: jest.fn(), create: jest.fn(), update: jest.fn(),
            countByTierId: jest.fn(), getTierUserCounts: jest.fn(), acquireLock: jest.fn(),
            findManyByTierId: jest.fn(), findUserIdsWithoutTier: jest.fn(),
        };

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                GetUserTierService,
                { provide: USER_TIER_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<GetUserTierService>(GetUserTierService);
        jest.clearAllMocks();
    });

    afterEach(async () => { await module.close(); });

    describe('execute', () => {
        it('should return user tier when found', async () => {
            const userTier = createMockUserTier();
            mockRepository.findByUserId.mockResolvedValue(userTier);

            const result = await service.execute(userId);

            expect(result).toEqual(userTier);
            expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
        });

        it('should return null when user tier not found', async () => {
            mockRepository.findByUserId.mockResolvedValue(null);

            const result = await service.execute(userId);

            expect(result).toBeNull();
        });
    });
});
