// src/modules/promotion/application/grant-promotion-bonus.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import {
    Prisma,
    PromotionTargetType,
    PromotionBonusType,
    PromotionQualification,
    ExchangeCurrencyCode,
    UserPromotionStatus,
} from '@repo/database';
import { GrantPromotionBonusService } from './grant-promotion-bonus.service';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { Promotion, PromotionCurrency, UserPromotion, PromotionPolicy, PromotionNotFoundException } from '../domain';
import { CreateWageringRequirementService } from '../../wagering/application/create-wagering-requirement.service';

describe('GrantPromotionBonusService', () => {
    let module: TestingModule;
    let service: GrantPromotionBonusService;
    let mockRepository: jest.Mocked<PromotionRepositoryPort>;
    let mockPolicy: jest.Mocked<PromotionPolicy>;
    let mockWageringService: jest.Mocked<CreateWageringRequirementService>;

    const userId = BigInt(100);
    const promotionId = BigInt(1);

    const createPromotion = () => {
        return Promotion.fromPersistence({
            id: promotionId,
            code: 'PROMO_CODE',
            managementName: 'Test Promotion',
            isActive: true,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
            bonusType: PromotionBonusType.PERCENTAGE,
            bonusRate: new Prisma.Decimal(0.1), // 10%
            rollingMultiplier: new Prisma.Decimal(5),
            qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
            isOneTime: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const createCurrencySettings = () => {
        return PromotionCurrency.fromPersistence({
            id: BigInt(1),
            promotionId: BigInt(1),
            currency: ExchangeCurrencyCode.USDT,
            minDepositAmount: new Prisma.Decimal(10),
            maxBonusAmount: new Prisma.Decimal(100),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const createUserPromotion = () => {
        return UserPromotion.fromPersistence({
            id: BigInt(1),
            userId,
            promotionId: BigInt(1),
            status: UserPromotionStatus.ACTIVE,
            depositAmount: new Prisma.Decimal(100),
            bonusAmount: new Prisma.Decimal(10),
            targetRollingAmount: new Prisma.Decimal(50),
            currentRollingAmount: new Prisma.Decimal(0),
            currency: ExchangeCurrencyCode.USDT,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockRepository = {
            findById: jest.fn(),
            getCurrencySettings: jest.fn(),
            hasPreviousDeposits: jest.fn(),
            hasWithdrawn: jest.fn(),
            findUserPromotion: jest.fn(),
            createUserPromotion: jest.fn(),
        } as any;

        mockPolicy = {
            validateEligibility: jest.fn(),
        } as any;

        mockWageringService = {
            execute: jest.fn().mockResolvedValue({}),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                GrantPromotionBonusService,
                { provide: PROMOTION_REPOSITORY, useValue: mockRepository },
                { provide: PromotionPolicy, useValue: mockPolicy },
                { provide: CreateWageringRequirementService, useValue: mockWageringService },
            ],
        }).compile();

        service = module.get<GrantPromotionBonusService>(GrantPromotionBonusService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should grant promotion bonus successfully', async () => {
            const promotion = createPromotion();
            const currencySettings = createCurrencySettings();
            const userPromotion = createUserPromotion();

            mockRepository.findById.mockResolvedValue(promotion);
            mockRepository.getCurrencySettings.mockResolvedValue(currencySettings);
            mockRepository.hasPreviousDeposits.mockResolvedValue(false);
            mockRepository.hasWithdrawn.mockResolvedValue(false);
            mockRepository.findUserPromotion.mockResolvedValue(null);
            mockRepository.createUserPromotion.mockResolvedValue(userPromotion);

            const result = await service.execute({
                userId,
                promotionId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
                depositDetailId: BigInt(1),
                now: new Date('2024-06-15'),
            });

            expect(result.bonusAmount).toEqual(new Prisma.Decimal(10));
            expect(result.userPromotion).toBeDefined();
            expect(result.rollingCreated).toBe(true);

            expect(mockPolicy.validateEligibility).toHaveBeenCalled();
            expect(mockRepository.createUserPromotion).toHaveBeenCalled();
            expect(mockWageringService.execute).toHaveBeenCalled();
        });

        it('should throw PromotionNotFoundException when promotion not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                service.execute({
                    userId,
                    promotionId,
                    depositAmount: new Prisma.Decimal(100),
                    currency: ExchangeCurrencyCode.USDT,
                    depositDetailId: BigInt(1),
                }),
            ).rejects.toThrow(PromotionNotFoundException);
        });

        it('should not create wagering when target rolling is 0', async () => {
            const promotion = Promotion.fromPersistence({
                id: promotionId,
                code: 'PROMO_CODE',
                managementName: 'Test Promotion',
                isActive: true,
                startDate: null,
                endDate: null,
                targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
                bonusType: PromotionBonusType.PERCENTAGE,
                bonusRate: new Prisma.Decimal(0.1),
                rollingMultiplier: new Prisma.Decimal(0), // No rolling
                qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
                isOneTime: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const currencySettings = createCurrencySettings();
            const userPromotion = UserPromotion.fromPersistence({
                id: BigInt(1),
                userId,
                promotionId: BigInt(1),
                status: UserPromotionStatus.ACTIVE,
                depositAmount: new Prisma.Decimal(100),
                bonusAmount: new Prisma.Decimal(10),
                targetRollingAmount: new Prisma.Decimal(0), // No rolling
                currentRollingAmount: new Prisma.Decimal(0),
                currency: ExchangeCurrencyCode.USDT,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockRepository.findById.mockResolvedValue(promotion);
            mockRepository.getCurrencySettings.mockResolvedValue(currencySettings);
            mockRepository.hasPreviousDeposits.mockResolvedValue(false);
            mockRepository.hasWithdrawn.mockResolvedValue(false);
            mockRepository.findUserPromotion.mockResolvedValue(null);
            mockRepository.createUserPromotion.mockResolvedValue(userPromotion);

            const result = await service.execute({
                userId,
                promotionId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
                depositDetailId: BigInt(1),
            });

            expect(result.rollingCreated).toBe(false);
            expect(mockWageringService.execute).not.toHaveBeenCalled();
        });

        it('should validate eligibility before granting bonus', async () => {
            const promotion = createPromotion();
            const currencySettings = createCurrencySettings();

            mockRepository.findById.mockResolvedValue(promotion);
            mockRepository.getCurrencySettings.mockResolvedValue(currencySettings);
            mockRepository.hasPreviousDeposits.mockResolvedValue(true);
            mockRepository.hasWithdrawn.mockResolvedValue(false);
            mockRepository.findUserPromotion.mockResolvedValue(null);

            mockPolicy.validateEligibility.mockImplementation(() => {
                throw new Error('Not eligible');
            });

            await expect(
                service.execute({
                    userId,
                    promotionId,
                    depositAmount: new Prisma.Decimal(100),
                    currency: ExchangeCurrencyCode.USDT,
                    depositDetailId: BigInt(1),
                }),
            ).rejects.toThrow('Not eligible');

            expect(mockRepository.createUserPromotion).not.toHaveBeenCalled();
        });
    });
});
