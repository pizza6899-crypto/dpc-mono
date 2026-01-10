// src/modules/promotion/application/toggle-promotion-active.service.spec.ts
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
import { TogglePromotionActiveService } from './toggle-promotion-active.service';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { Promotion, PromotionNotFoundException } from '../domain';

describe('TogglePromotionActiveService', () => {
    let module: TestingModule;
    let service: TogglePromotionActiveService;
    let mockRepository: jest.Mocked<PromotionRepositoryPort>;

    const createPromotion = (isActive: boolean) => {
        return Promotion.fromPersistence({
            id: BigInt(1),
            uid: 'promo-uid-123',
            managementName: 'Test Promotion',
            isActive,
            startDate: null,
            endDate: null,
            targetType: PromotionTargetType.ALL_USERS,
            bonusType: PromotionBonusType.PERCENTAGE,
            bonusRate: new Prisma.Decimal(0.1),
            rollingMultiplier: new Prisma.Decimal(5),
            qualificationMaintainCondition: PromotionQualification.ALWAYS,
            isOneTime: false,
            createdAt: new Date(),
            updatedAt: new Date(),
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
                TogglePromotionActiveService,
                { provide: PROMOTION_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<TogglePromotionActiveService>(TogglePromotionActiveService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should toggle active to inactive', async () => {
            const activePromotion = createPromotion(true);
            const updatedPromotion = createPromotion(false);

            mockRepository.findById.mockResolvedValue(activePromotion);
            mockRepository.update.mockResolvedValue(updatedPromotion);

            const result = await service.execute(BigInt(1));

            expect(result.isActive).toBe(false);
            expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(1));
            expect(mockRepository.update).toHaveBeenCalled();
        });

        it('should toggle inactive to active', async () => {
            const inactivePromotion = createPromotion(false);
            const updatedPromotion = createPromotion(true);

            mockRepository.findById.mockResolvedValue(inactivePromotion);
            mockRepository.update.mockResolvedValue(updatedPromotion);

            const result = await service.execute(BigInt(1));

            expect(result.isActive).toBe(true);
        });

        it('should throw PromotionNotFoundException when not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.execute(BigInt(999))).rejects.toThrow(
                PromotionNotFoundException,
            );
        });
    });
});
