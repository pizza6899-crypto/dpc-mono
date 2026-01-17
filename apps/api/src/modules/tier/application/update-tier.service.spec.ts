// src/modules/tier/application/update-tier.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from 'src/generated/prisma';
import { UpdateTierService } from './update-tier.service';
import { TIER_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import { Tier, TierNotFoundException, TierException } from '../domain';

describe('UpdateTierService', () => {
    let module: TestingModule;
    let service: UpdateTierService;
    let mockRepository: jest.Mocked<TierRepositoryPort>;

    const createMockTier = (params: Partial<{
        id: bigint;
        priority: number;
        code: string;
        requirementUsd: number;
    }> = {}): Tier => {
        return Tier.fromPersistence({
            id: params.id ?? BigInt(1),
            uid: 'tier-uid',
            priority: params.priority ?? 1,
            code: params.code ?? 'BRONZE',
            requirementUsd: new Prisma.Decimal(params.requirementUsd ?? 0),
            levelUpBonusUsd: new Prisma.Decimal(0),
            compRate: new Prisma.Decimal(0),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockRepository = {
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

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                UpdateTierService,
                {
                    provide: TIER_REPOSITORY,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UpdateTierService>(UpdateTierService);
        mockRepository = module.get(TIER_REPOSITORY);

        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should update tier successfully', async () => {
            const existingTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const updatedTier = createMockTier({
                id: BigInt(1),
                priority: 1,
                code: 'BRONZE',
                requirementUsd: 5000,
            });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(existingTier);
            mockRepository.update.mockResolvedValue(updatedTier);

            const result = await service.execute({
                id: BigInt(1),
                requirementUsd: 5000,
            });

            expect(result).toEqual(updatedTier);
            expect(mockRepository.acquireGlobalLock).toHaveBeenCalled();
            expect(mockRepository.update).toHaveBeenCalled();
        });

        it('should throw error when tier not found', async () => {
            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                service.execute({
                    id: BigInt(999),
                    requirementUsd: 5000,
                }),
            ).rejects.toThrow(TierNotFoundException);

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when changing to existing code', async () => {
            const existingTier = createMockTier({ id: BigInt(1), code: 'BRONZE' });
            const otherTier = createMockTier({ id: BigInt(2), code: 'SILVER' });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(existingTier);
            mockRepository.findByCode.mockResolvedValue(otherTier);

            await expect(
                service.execute({
                    id: BigInt(1),
                    code: 'SILVER',
                }),
            ).rejects.toThrow(TierException);
            await expect(
                service.execute({
                    id: BigInt(1),
                    code: 'SILVER',
                }),
            ).rejects.toThrow('Tier code SILVER is already in use');
        });

        it('should throw error when changing to existing priority', async () => {
            const existingTier = createMockTier({ id: BigInt(1), priority: 1 });
            const otherTier = createMockTier({ id: BigInt(2), priority: 3 });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(existingTier);
            mockRepository.findByPriority.mockResolvedValue(otherTier);

            await expect(
                service.execute({
                    id: BigInt(1),
                    priority: 3,
                }),
            ).rejects.toThrow(TierException);
            await expect(
                service.execute({
                    id: BigInt(1),
                    priority: 3,
                }),
            ).rejects.toThrow('Tier priority 3 is already in use');
        });

        it('should allow keeping same code', async () => {
            const existingTier = createMockTier({ id: BigInt(1), code: 'BRONZE' });
            const updatedTier = createMockTier({
                id: BigInt(1),
                code: 'BRONZE',
                requirementUsd: 1000,
            });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(existingTier);
            mockRepository.findByCode.mockResolvedValue(existingTier); // 동일한 tier
            mockRepository.update.mockResolvedValue(updatedTier);

            const result = await service.execute({
                id: BigInt(1),
                code: 'BRONZE',
                requirementUsd: 1000,
            });

            expect(result).toEqual(updatedTier);
            expect(mockRepository.update).toHaveBeenCalled();
        });

        it('should allow keeping same priority', async () => {
            const existingTier = createMockTier({ id: BigInt(1), priority: 2 });
            const updatedTier = createMockTier({ id: BigInt(1), priority: 2, requirementUsd: 5000 });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(existingTier);
            mockRepository.findByPriority.mockResolvedValue(existingTier); // 동일한 tier
            mockRepository.update.mockResolvedValue(updatedTier);

            const result = await service.execute({
                id: BigInt(1),
                priority: 2,
                requirementUsd: 5000,
            });

            expect(result).toEqual(updatedTier);
            expect(mockRepository.update).toHaveBeenCalled();
        });

        it('should update all provided fields', async () => {
            const existingTier = createMockTier({ id: BigInt(1), priority: 1, code: 'BRONZE' });
            const updatedTier = createMockTier({
                id: BigInt(1),
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000,
            });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(existingTier);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findByPriority.mockResolvedValue(null);
            mockRepository.update.mockResolvedValue(updatedTier);

            await service.execute({
                id: BigInt(1),
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000,
                levelUpBonusUsd: 50,
                compRate: 0.025,
            });

            expect(mockRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    priority: 2,
                    code: 'SILVER',
                    requirementUsd: new Prisma.Decimal(10000),
                    levelUpBonusUsd: new Prisma.Decimal(50),
                    compRate: new Prisma.Decimal(0.025),
                }),
            );
        });

        it('should acquire global lock before updating', async () => {
            const existingTier = createMockTier();
            const updatedTier = createMockTier();

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(existingTier);
            mockRepository.update.mockResolvedValue(updatedTier);

            await service.execute({ id: BigInt(1), requirementUsd: 500 });

            expect(mockRepository.acquireGlobalLock).toHaveBeenCalledTimes(1);
            expect(mockRepository.findById).toHaveBeenCalled();
        });
    });
});
