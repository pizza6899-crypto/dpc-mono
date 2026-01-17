// src/modules/tier/application/add-user-rolling.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from 'src/generated/prisma';
import { AddUserRollingService } from './add-user-rolling.service';
import { TIER_REPOSITORY, USER_TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { Tier, UserTier, UserTierNotFoundException, TierChangeType } from '../domain';

describe('AddUserRollingService', () => {
    let module: TestingModule;
    let service: AddUserRollingService;
    let mockTierRepository: jest.Mocked<TierRepositoryPort>;
    let mockUserTierRepository: jest.Mocked<UserTierRepositoryPort>;
    let mockTierHistoryRepository: jest.Mocked<TierHistoryRepositoryPort>;

    const userId = BigInt(100);

    const createMockTier = (params: Partial<{
        id: bigint;
        priority: number;
        code: string;
        requirementUsd: number;
        levelUpBonusUsd: number;
    }> = {}): Tier => {
        return Tier.fromPersistence({
            id: params.id ?? BigInt(1),
            uid: 'tier-uid',
            priority: params.priority ?? 1,
            code: params.code ?? 'BRONZE',
            requirementUsd: new Prisma.Decimal(params.requirementUsd ?? 0),
            levelUpBonusUsd: new Prisma.Decimal(params.levelUpBonusUsd ?? 0),
            compRate: new Prisma.Decimal(0),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const createMockUserTier = (params: Partial<{
        id: bigint;
        userId: bigint;
        tierId: bigint;
        totalRollingUsd: number;
        highestPromotedPriority: number;
        isManualLock: boolean;
        tier: Tier;
    }> = {}): UserTier => {
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
            tier: params.tier,
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
                AddUserRollingService,
                { provide: TIER_REPOSITORY, useValue: mockTierRepository },
                { provide: USER_TIER_REPOSITORY, useValue: mockUserTierRepository },
                { provide: TIER_HISTORY_REPOSITORY, useValue: mockTierHistoryRepository },
            ],
        }).compile();

        service = module.get<AddUserRollingService>(AddUserRollingService);

        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should add rolling amount without upgrade', async () => {
            const bronzeTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const silverTier = createMockTier({ id: BigInt(2), priority: 2, code: 'SILVER', requirementUsd: 10000 });
            const userTier = createMockUserTier({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 3000, // 10000 requirement 미달
                tier: bronzeTier,
            });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockTierRepository.findAll.mockResolvedValue([bronzeTier, silverTier]);
            mockUserTierRepository.update.mockResolvedValue(userTier);

            await service.execute(userId, new Prisma.Decimal(1000));

            expect(mockUserTierRepository.acquireLock).toHaveBeenCalledWith(userId);
            expect(mockUserTierRepository.update).toHaveBeenCalled();
            expect(mockTierHistoryRepository.create).not.toHaveBeenCalled();
        });

        it('should upgrade tier when requirement met', async () => {
            const bronzeTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const silverTier = createMockTier({ id: BigInt(2), priority: 2, code: 'SILVER', requirementUsd: 10000, levelUpBonusUsd: 50 });
            const userTier = createMockUserTier({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 9000, // +2000 -> 11000 >= 10000 requirement
                highestPromotedPriority: 1,
                tier: bronzeTier,
            });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockTierRepository.findAll.mockResolvedValue([bronzeTier, silverTier]);
            mockUserTierRepository.update.mockResolvedValue(userTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId, new Prisma.Decimal(2000));

            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    fromTierId: BigInt(1),
                    toTierId: BigInt(2),
                    changeType: TierChangeType.UPGRADE,
                    reason: 'Rolling accumulation',
                }),
            );
            expect(mockUserTierRepository.update).toHaveBeenCalled();
        });

        it('should throw error when user tier not found', async () => {
            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(null);

            await expect(service.execute(userId, new Prisma.Decimal(1000))).rejects.toThrow(
                UserTierNotFoundException,
            );

            expect(mockUserTierRepository.update).not.toHaveBeenCalled();
        });

        it('should upgrade to highest satisfied tier', async () => {
            const bronzeTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const silverTier = createMockTier({ id: BigInt(2), priority: 2, code: 'SILVER', requirementUsd: 10000 });
            const goldTier = createMockTier({ id: BigInt(3), priority: 3, code: 'GOLD', requirementUsd: 25000 });
            const platinumTier = createMockTier({ id: BigInt(4), priority: 4, code: 'PLATINUM', requirementUsd: 50000 });

            const userTier = createMockUserTier({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 40000, // +15000 -> 55000, PLATINUM 달성
                highestPromotedPriority: 1,
                tier: bronzeTier,
            });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockTierRepository.findAll.mockResolvedValue([bronzeTier, silverTier, goldTier, platinumTier]);
            mockUserTierRepository.update.mockResolvedValue(userTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId, new Prisma.Decimal(15000));

            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    toTierId: BigInt(4), // PLATINUM
                }),
            );
        });

        it('should not upgrade when manually locked', async () => {
            const bronzeTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const silverTier = createMockTier({ id: BigInt(2), priority: 2, code: 'SILVER', requirementUsd: 10000 });

            const userTier = createMockUserTier({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 50000, // requirement 충족하지만 locked
                isManualLock: true,
                tier: bronzeTier,
            });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockTierRepository.findAll.mockResolvedValue([bronzeTier, silverTier]);
            mockUserTierRepository.update.mockResolvedValue(userTier);

            await service.execute(userId, new Prisma.Decimal(1000));

            expect(mockTierHistoryRepository.create).not.toHaveBeenCalled();
        });

        it('should include level up bonus when reaching new peak', async () => {
            const bronzeTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const silverTier = createMockTier({ id: BigInt(2), priority: 2, code: 'SILVER', requirementUsd: 10000, levelUpBonusUsd: 100 });

            const userTier = createMockUserTier({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 9500,
                highestPromotedPriority: 1, // 처음 SILVER 달성
                tier: bronzeTier,
            });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockTierRepository.findAll.mockResolvedValue([bronzeTier, silverTier]);
            mockUserTierRepository.update.mockResolvedValue(userTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId, new Prisma.Decimal(1000));

            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    bonusAmount: new Prisma.Decimal(100),
                }),
            );
        });

        it('should not include level up bonus when not new peak', async () => {
            const bronzeTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const silverTier = createMockTier({ id: BigInt(2), priority: 2, code: 'SILVER', requirementUsd: 10000, levelUpBonusUsd: 100 });

            const userTier = createMockUserTier({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 9500,
                highestPromotedPriority: 3, // 이미 더 높은 티어 달성 이력
                tier: bronzeTier,
            });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockTierRepository.findAll.mockResolvedValue([bronzeTier, silverTier]);
            mockUserTierRepository.update.mockResolvedValue(userTier);
            mockTierHistoryRepository.create.mockResolvedValue({} as any);

            await service.execute(userId, new Prisma.Decimal(1000));

            expect(mockTierHistoryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    bonusAmount: new Prisma.Decimal(0),
                }),
            );
        });

        it('should skip upgrade logic when current tier not loaded', async () => {
            const userTier = createMockUserTier({
                userId,
                tierId: BigInt(1),
                totalRollingUsd: 50000,
                // tier 없음
            });

            mockUserTierRepository.acquireLock.mockResolvedValue(undefined);
            mockUserTierRepository.findByUserId.mockResolvedValue(userTier);
            mockUserTierRepository.update.mockResolvedValue(userTier);

            await service.execute(userId, new Prisma.Decimal(1000));

            expect(mockTierRepository.findAll).not.toHaveBeenCalled();
            expect(mockTierHistoryRepository.create).not.toHaveBeenCalled();
            expect(mockUserTierRepository.update).toHaveBeenCalled();
        });
    });
});
