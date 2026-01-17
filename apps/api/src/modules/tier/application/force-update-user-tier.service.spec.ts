// src/modules/tier/application/force-update-user-tier.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from 'src/generated/prisma';
import { ForceUpdateUserTierService } from './force-update-user-tier.service';
import { TIER_REPOSITORY, USER_TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { Tier, UserTier, TierNotFoundException, UserTierNotFoundException, TierChangeType } from '../domain';

describe('ForceUpdateUserTierService', () => {
    let module: TestingModule;
    let service: ForceUpdateUserTierService;
    let mockTierRepository: jest.Mocked<TierRepositoryPort>;
    let mockUserTierRepository: jest.Mocked<UserTierRepositoryPort>;
    let mockTierHistoryRepository: jest.Mocked<TierHistoryRepositoryPort>;

    const userId = BigInt(100);

    const createMockTier = (params: Partial<{ id: bigint; priority: number; code: string }> = {}): Tier => {
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

    const createMockUserTier = (params: Partial<{ id: bigint; userId: bigint; tierId: bigint; totalRollingUsd: number; highestPromotedPriority: number; isManualLock: boolean }> = {}): UserTier => {
        return UserTier.fromPersistence({
            id: params.id ?? BigInt(1),
            uid: 'user-tier-uid',
            userId: params.userId ?? BigInt(100),
            tierId: params.tierId ?? BigInt(1),
            totalRollingUsd: new Prisma.Decimal(params.totalRollingUsd ?? 0),
            highestPromotedPriority: params.highestPromotedPriority ?? 1,
            isManualLock: params.isManualLock ?? false,
            lastPromotedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockTierRepository = {
            findAll: jest.fn(), findByCode: jest.fn(), findByPriority: jest.fn(),
            findLowestPriority: jest.fn(), findById: jest.fn(), create: jest.fn(),
            update: jest.fn(), acquireGlobalLock: jest.fn(), saveTranslation: jest.fn(),
        };
        mockUserTierRepository = {
            findByUserId: jest.fn(), findByUid: jest.fn(), create: jest.fn(), update: jest.fn(),
            countByTierId: jest.fn(), getTierUserCounts: jest.fn(), acquireLock: jest.fn(),
            findManyByTierId: jest.fn(), findUserIdsWithoutTier: jest.fn(),
        };
        mockTierHistoryRepository = { findHistory: jest.fn(), create: jest.fn() };

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                ForceUpdateUserTierService,
                { provide: TIER_REPOSITORY, useValue: mockTierRepository },
                { provide: USER_TIER_REPOSITORY, useValue: mockUserTierRepository },
                { provide: TIER_HISTORY_REPOSITORY, useValue: mockTierHistoryRepository },
            ],
        }).compile();

        service = module.get<ForceUpdateUserTierService>(ForceUpdateUserTierService);
        jest.clearAllMocks();
    });

    afterEach(async () => { await module.close(); });

    describe('execute', () => {
        it('should force update user tier successfully', async () => {
            const goldTier = createMockTier({ id: BigInt(3), priority: 3, code: 'GOLD' });
            const userTier = createMockUserTier({ userId, tierId: BigInt(1) });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockTierRepository.findByCode.mockResolvedValue(goldTier);
            mockUserTierRepository.update.mockResolvedValue(userTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId, 'GOLD', 'VIP Upgrade');

            expect(mockTierRepository.findByCode).toHaveBeenCalledWith('GOLD');
            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId, toTierId: BigInt(3), changeType: TierChangeType.MANUAL_UPDATE, reason: 'VIP Upgrade' }),
            );
        });

        it('should throw error when user tier not found', async () => {
            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(null);
            await expect(service.execute(userId, 'GOLD', 'Reason')).rejects.toThrow(UserTierNotFoundException);
        });

        it('should throw error when target tier not found', async () => {
            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(createMockUserTier({ userId }));
            mockTierRepository.findByCode.mockResolvedValue(null);
            await expect(service.execute(userId, 'INVALID', 'Reason')).rejects.toThrow(TierNotFoundException);
        });

        it('should use default reason when empty', async () => {
            const goldTier = createMockTier({ id: BigInt(3), code: 'GOLD' });
            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(createMockUserTier({ userId }));
            mockTierRepository.findByCode.mockResolvedValue(goldTier);
            mockUserTierRepository.update.mockResolvedValue(createMockUserTier({ userId }));
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId, 'GOLD', '');

            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(expect.objectContaining({ reason: 'Admin Manual Adjustment' }));
        });
    });
});
