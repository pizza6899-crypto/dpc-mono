// src/modules/promotion/application/delete-promotion.service.spec.ts
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
import { DeletePromotionService } from './delete-promotion.service';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { Promotion, PromotionNotFoundException } from '../domain';

describe('DeletePromotionService', () => {
    let module: TestingModule;
    let service: DeletePromotionService;
    let mockRepository: jest.Mocked<PromotionRepositoryPort>;

    const createPromotion = (deletedAt: Date | null = null) => {
        return Promotion.fromPersistence({
            id: BigInt(1),
            managementName: 'Test Promotion',
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
            deletedAt,
        });
    };

    beforeEach(async () => {
        mockRepository = {
            findById: jest.fn(),
            delete: jest.fn(),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                DeletePromotionService,
                { provide: PROMOTION_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<DeletePromotionService>(DeletePromotionService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should soft delete promotion', async () => {
            const promotion = createPromotion(null);

            mockRepository.findById.mockResolvedValue(promotion);
            mockRepository.delete.mockResolvedValue(undefined);

            await service.execute(BigInt(1));

            expect(mockRepository.findById).toHaveBeenCalledWith(BigInt(1));
            expect(mockRepository.delete).toHaveBeenCalledWith(BigInt(1));
        });

        it('should throw PromotionNotFoundException when not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.execute(BigInt(999))).rejects.toThrow(
                PromotionNotFoundException,
            );

            expect(mockRepository.delete).not.toHaveBeenCalled();
        });

        it('should skip deletion when already deleted', async () => {
            const deletedPromotion = createPromotion(new Date()); // Already deleted

            mockRepository.findById.mockResolvedValue(deletedPromotion);

            await service.execute(BigInt(1));

            expect(mockRepository.delete).not.toHaveBeenCalled();
        });
    });
});
