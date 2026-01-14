// src/modules/promotion/application/update-promotion.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import {
    Prisma,
    PromotionTargetType,
    PromotionBonusType,
    PromotionQualification,
} from '@repo/database';
import { UpdatePromotionService } from './update-promotion.service';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { Promotion, PromotionNotFoundException } from '../domain';

describe('UpdatePromotionService', () => {
    let module: TestingModule;
    let service: UpdatePromotionService;
    let mockRepository: jest.Mocked<PromotionRepositoryPort>;

    const createPromotion = (overrides: Partial<Parameters<typeof Promotion.fromPersistence>[0]> = {}) => {
        return Promotion.fromPersistence({
            id: BigInt(1),
            managementName: 'Original Name',
            isActive: true,
            startDate: null,
            endDate: null,
            targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
            bonusType: PromotionBonusType.PERCENTAGE,
            bonusRate: new Prisma.Decimal(0.1),
            rollingMultiplier: new Prisma.Decimal(5),
            qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
            isOneTime: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        });
    };

    beforeEach(async () => {
        mockRepository = {
            findById: jest.fn(),
            update: jest.fn(),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                UpdatePromotionService,
                { provide: PROMOTION_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<UpdatePromotionService>(UpdatePromotionService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should update promotion fields', async () => {
            const existingPromotion = createPromotion();
            const updatedPromotion = createPromotion({ managementName: 'Updated Name' });

            mockRepository.findById.mockResolvedValue(existingPromotion);
            mockRepository.update.mockResolvedValue(updatedPromotion);

            const result = await service.execute({
                id: BigInt(1),
                managementName: 'Updated Name',
                bonusRate: new Prisma.Decimal(0.2),
            });

            expect(result.managementName).toBe('Updated Name');
            expect(mockRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: BigInt(1),
                    managementName: 'Updated Name',
                    bonusRate: new Prisma.Decimal(0.2),
                }),
            );
        });

        it('should toggle isActive when changed', async () => {
            const activePromotion = createPromotion({ isActive: true });
            const updatedPromotion = createPromotion({ isActive: false });

            mockRepository.findById.mockResolvedValue(activePromotion);
            mockRepository.update.mockResolvedValue(updatedPromotion);

            await service.execute({
                id: BigInt(1),
                isActive: false,
            });

            expect(mockRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: false,
                }),
            );
        });

        it('should throw PromotionNotFoundException when not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                service.execute({
                    id: BigInt(999),
                    managementName: 'Test',
                }),
            ).rejects.toThrow(PromotionNotFoundException);

            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should only update provided fields', async () => {
            const existingPromotion = createPromotion();

            mockRepository.findById.mockResolvedValue(existingPromotion);
            mockRepository.update.mockResolvedValue(existingPromotion);

            await service.execute({
                id: BigInt(1),
                startDate: new Date('2024-01-01'),
            });

            expect(mockRepository.update).toHaveBeenCalledWith({
                id: BigInt(1),
                startDate: new Date('2024-01-01'),
            });
        });
    });
});
