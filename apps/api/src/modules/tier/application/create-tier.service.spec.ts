// src/modules/tier/application/create-tier.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma } from '@repo/database';
import { CreateTierService } from './create-tier.service';
import { TIER_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import { Tier, TierException } from '../domain';

describe('CreateTierService', () => {
    let module: TestingModule;
    let service: CreateTierService;
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
                CreateTierService,
                {
                    provide: TIER_REPOSITORY,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<CreateTierService>(CreateTierService);
        mockRepository = module.get(TIER_REPOSITORY);

        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should create a new tier successfully', async () => {
            const command = {
                priority: 1,
                code: 'BRONZE',
                requirementUsd: 0,
                levelUpBonusUsd: 10,
                compRate: 0.01,
            };
            const createdTier = createMockTier({ priority: 1, code: 'BRONZE' });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findByPriority.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(createdTier);

            const result = await service.execute(command);

            expect(result).toEqual(createdTier);
            expect(mockRepository.acquireGlobalLock).toHaveBeenCalled();
            expect(mockRepository.findByCode).toHaveBeenCalledWith('BRONZE');
            expect(mockRepository.findByPriority).toHaveBeenCalledWith(1);
            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    priority: 1,
                    code: 'BRONZE',
                }),
            );
        });

        it('should throw error when code already exists', async () => {
            const command = {
                priority: 2,
                code: 'SILVER',
                requirementUsd: 10000,
            };
            const existingTier = createMockTier({ code: 'SILVER' });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(existingTier);

            await expect(service.execute(command)).rejects.toThrow(TierException);
            await expect(service.execute(command)).rejects.toThrow(
                'Tier with code SILVER already exists',
            );
            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error when priority already exists', async () => {
            const command = {
                priority: 3,
                code: 'GOLD',
                requirementUsd: 25000,
            };
            const existingTier = createMockTier({ priority: 3, code: 'EXISTING' });

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findByPriority.mockResolvedValue(existingTier);

            await expect(service.execute(command)).rejects.toThrow(TierException);
            await expect(service.execute(command)).rejects.toThrow(
                'Tier with priority 3 already exists',
            );
            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should acquire global lock before creating', async () => {
            const command = {
                priority: 1,
                code: 'BRONZE',
                requirementUsd: 0,
            };
            const createdTier = createMockTier();

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findByPriority.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(createdTier);

            await service.execute(command);

            expect(mockRepository.acquireGlobalLock).toHaveBeenCalledTimes(1);
            expect(mockRepository.findByCode).toHaveBeenCalled();
        });

        it('should create tier with default optional values', async () => {
            const command = {
                priority: 1,
                code: 'BRONZE',
                requirementUsd: 0,
            };
            const createdTier = createMockTier();

            mockRepository.acquireGlobalLock.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findByPriority.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(createdTier);

            await service.execute(command);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    priority: 1,
                    code: 'BRONZE',
                }),
            );
        });
    });
});
