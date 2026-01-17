// src/modules/tier/application/unlock-user-tier.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from 'src/generated/prisma';
import { UnlockUserTierService } from './unlock-user-tier.service';
import { USER_TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { UserTier, UserTierNotFoundException, TierChangeType } from '../domain';

describe('UnlockUserTierService', () => {
    let module: TestingModule;
    let service: UnlockUserTierService;
    let mockUserTierRepository: jest.Mocked<UserTierRepositoryPort>;
    let mockTierHistoryRepository: jest.Mocked<TierHistoryRepositoryPort>;

    const userId = BigInt(100);

    const createMockUserTier = (params: Partial<{ tierId: bigint; isManualLock: boolean; totalRollingUsd: number }> = {}): UserTier => {
        return UserTier.fromPersistence({
            id: BigInt(1),
            uid: 'user-tier-uid',
            userId,
            tierId: params.tierId ?? BigInt(1),
            totalRollingUsd: new Prisma.Decimal(params.totalRollingUsd ?? 0),
            highestPromotedPriority: 1,
            isManualLock: params.isManualLock ?? false,
            lastPromotedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockUserTierRepository = {
            findByUserId: jest.fn(), findByUid: jest.fn(), create: jest.fn(), update: jest.fn(),
            countByTierId: jest.fn(), getTierUserCounts: jest.fn(), acquireLock: jest.fn(),
            findManyByTierId: jest.fn(), findUserIdsWithoutTier: jest.fn(),
        };
        mockTierHistoryRepository = { findHistory: jest.fn(), create: jest.fn() };

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                UnlockUserTierService,
                { provide: USER_TIER_REPOSITORY, useValue: mockUserTierRepository },
                { provide: TIER_HISTORY_REPOSITORY, useValue: mockTierHistoryRepository },
            ],
        }).compile();

        service = module.get<UnlockUserTierService>(UnlockUserTierService);
        jest.clearAllMocks();
    });

    afterEach(async () => { await module.close(); });

    describe('execute', () => {
        it('should unlock user tier successfully', async () => {
            const userTier = createMockUserTier({ tierId: BigInt(2), isManualLock: true, totalRollingUsd: 5000 });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockUserTierRepository.update.mockResolvedValue(userTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId, 'Admin unlocked');

            expect(mockUserTierRepository.acquireLock).toHaveBeenCalledWith(userId);
            expect(mockUserTierRepository.update).toHaveBeenCalled();
            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    fromTierId: BigInt(2),
                    toTierId: BigInt(2),
                    changeType: TierChangeType.MANUAL_UPDATE,
                    reason: 'Admin unlocked',
                    rollingSnapshot: new Prisma.Decimal(5000),
                }),
            );
        });

        it('should skip when already unlocked', async () => {
            const userTier = createMockUserTier({ isManualLock: false });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);

            await service.execute(userId);

            expect(mockUserTierRepository.update).not.toHaveBeenCalled();
            expect(mockTierHistoryRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when user tier not found', async () => {
            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(null);

            await expect(service.execute(userId)).rejects.toThrow(UserTierNotFoundException);
        });

        it('should use default reason when not provided', async () => {
            const userTier = createMockUserTier({ isManualLock: true });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockUserTierRepository.update.mockResolvedValue(userTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId);

            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ reason: 'Admin unlocked tier' }),
            );
        });
    });
});
