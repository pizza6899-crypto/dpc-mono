// src/modules/tier/application/assign-default-tier.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from '@prisma/client';
import { AssignDefaultTierService } from './assign-default-tier.service';
import { TIER_REPOSITORY, USER_TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { Tier, UserTier, TierException, TierChangeType } from '../domain';

describe('AssignDefaultTierService', () => {
    let module: TestingModule;
    let service: AssignDefaultTierService;
    let mockTierRepository: jest.Mocked<TierRepositoryPort>;
    let mockUserTierRepository: jest.Mocked<UserTierRepositoryPort>;
    let mockTierHistoryRepository: jest.Mocked<TierHistoryRepositoryPort>;

    const userId = BigInt(100);

    const createMockTier = (params: Partial<{
        id: bigint;
        priority: number;
        code: string;
    }> = {}): Tier => {
        return Tier.fromPersistence({
            id: params.id ?? BigInt(1),
            uid: 'tier-uid',
            priority: params.priority ?? 1,
            code: params.code ?? 'BRONZE',
            requirementUsd: new Prisma.Decimal(0),
            levelUpBonusUsd: new Prisma.Decimal(0),
            compRate: new Prisma.Decimal(0),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const createMockUserTier = (params: Partial<{
        id: bigint;
        userId: bigint;
        tierId: bigint;
    }> = {}): UserTier => {
        return UserTier.fromPersistence({
            id: params.id ?? BigInt(1),
            uid: 'user-tier-uid',
            userId: params.userId ?? BigInt(100),
            tierId: params.tierId ?? BigInt(1),
            totalRollingUsd: new Prisma.Decimal(0),
            highestPromotedPriority: 1,
            isManualLock: false,
            lastPromotedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockTierRepository = {
            findAll: jest.fn(),
            findByCode: jest.fn(),
            findByPriority: jest.fn(),
            findLowestPriority: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            acquireGlobalLock: jest.fn(),
            saveTranslation: jest.fn(),
        };

        mockUserTierRepository = {
            findByUserId: jest.fn(),
            findByUid: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            countByTierId: jest.fn(),
            getTierUserCounts: jest.fn(),
            acquireLock: jest.fn(),
            findManyByTierId: jest.fn(),
            findUserIdsWithoutTier: jest.fn(),
        };

        mockTierHistoryRepository = {
            findHistory: jest.fn(),
            create: jest.fn(),
        };

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                AssignDefaultTierService,
                { provide: TIER_REPOSITORY, useValue: mockTierRepository },
                { provide: USER_TIER_REPOSITORY, useValue: mockUserTierRepository },
                { provide: TIER_HISTORY_REPOSITORY, useValue: mockTierHistoryRepository },
            ],
        }).compile();

        service = module.get<AssignDefaultTierService>(AssignDefaultTierService);

        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should assign default tier to new user', async () => {
            const defaultTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const createdUserTier = createMockUserTier({ userId, tierId: BigInt(1) });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(null);
            mockTierRepository.findLowestPriority.mockResolvedValue(defaultTier);
            mockUserTierRepository.create.mockResolvedValue(createdUserTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            const result = await service.execute(userId);

            expect(result).toEqual(createdUserTier);
            expect(mockUserTierRepository.acquireLock).toHaveBeenCalledWith(userId);
            expect(mockUserTierRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(mockTierRepository.findLowestPriority).toHaveBeenCalled();
            expect(mockUserTierRepository.create).toHaveBeenCalled();
            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    changeType: TierChangeType.INITIAL,
                }),
            );
        });

        it('should return existing user tier if already assigned (idempotency)', async () => {
            const existingUserTier = createMockUserTier({ userId, tierId: BigInt(2) });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(existingUserTier);

            const result = await service.execute(userId);

            expect(result).toEqual(existingUserTier);
            expect(mockTierRepository.findLowestPriority).not.toHaveBeenCalled();
            expect(mockUserTierRepository.create).not.toHaveBeenCalled();
            expect(mockTierHistoryRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when no default tier found', async () => {
            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(null);
            mockTierRepository.findLowestPriority.mockResolvedValue(null);

            await expect(service.execute(userId)).rejects.toThrow(TierException);
            await expect(service.execute(userId)).rejects.toThrow('No default tier found to assign');

            expect(mockUserTierRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when default tier has no id', async () => {
            const invalidTier = Tier.create({
                priority: 1,
                code: 'BRONZE',
                requirementUsd: 0,
            }); // id is null

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(null);
            mockTierRepository.findLowestPriority.mockResolvedValue(invalidTier);

            await expect(service.execute(userId)).rejects.toThrow(TierException);

            expect(mockUserTierRepository.create).not.toHaveBeenCalled();
        });

        it('should create tier history with INITIAL change type', async () => {
            const defaultTier = createMockTier({ id: BigInt(1), priority: 1 });
            const createdUserTier = createMockUserTier({ userId, tierId: BigInt(1) });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(null);
            mockTierRepository.findLowestPriority.mockResolvedValue(defaultTier);
            mockUserTierRepository.create.mockResolvedValue(createdUserTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId);

            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    toTierId: BigInt(1),
                    changeType: TierChangeType.INITIAL,
                    reason: 'Initial Assignment',
                    rollingSnapshot: new Prisma.Decimal(0),
                    bonusAmount: new Prisma.Decimal(0),
                }),
            );
        });

        it('should acquire lock before checking existing tier', async () => {
            const existingUserTier = createMockUserTier({ userId });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(existingUserTier);

            await service.execute(userId);

            expect(mockUserTierRepository.acquireLock).toHaveBeenCalledWith(userId);
            expect(mockUserTierRepository.findByUserId).toHaveBeenCalledWith(userId);
        });
    });
});
