// src/modules/promotion/application/check-eligible-promotions.service.spec.ts
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
import { CheckEligiblePromotionsService } from './check-eligible-promotions.service';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { Promotion, PromotionCurrency, UserPromotion } from '../domain';

describe('CheckEligiblePromotionsService', () => {
    let module: TestingModule;
    let service: CheckEligiblePromotionsService;
    let mockRepository: jest.Mocked<PromotionRepositoryPort>;

    const userId = BigInt(100);

    const createPromotion = (id: bigint, overrides: Partial<Parameters<typeof Promotion.fromPersistence>[0]> = {}) => {
        return Promotion.fromPersistence({
            id,
            managementName: `Promotion ${id}`,
            isActive: true,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
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

    const createCurrencySettings = (minDeposit = 10) => {
        return PromotionCurrency.fromPersistence({
            id: 1,
            promotionId: 1,
            currency: ExchangeCurrencyCode.USDT,
            minDepositAmount: new Prisma.Decimal(minDeposit),
            maxBonusAmount: new Prisma.Decimal(100),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    beforeEach(async () => {
        mockRepository = {
            findActivePromotions: jest.fn(),
            getCurrencySettings: jest.fn(),
            hasPreviousDeposits: jest.fn(),
            hasWithdrawn: jest.fn(),
            findUserPromotion: jest.fn(),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                CheckEligiblePromotionsService,
                { provide: PROMOTION_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<CheckEligiblePromotionsService>(CheckEligiblePromotionsService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should return eligible promotions', async () => {
            const promotions = [
                createPromotion(BigInt(1)),
                createPromotion(BigInt(2)),
            ];

            mockRepository.findActivePromotions.mockResolvedValue(promotions);
            mockRepository.getCurrencySettings.mockResolvedValue(createCurrencySettings(10));
            mockRepository.hasPreviousDeposits.mockResolvedValue(false);
            mockRepository.hasWithdrawn.mockResolvedValue(false);

            const result = await service.execute({
                userId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
                now: new Date('2024-06-15'),
            });

            expect(result).toHaveLength(2);
        });

        it('should filter out promotions where deposit is below minimum', async () => {
            const promotions = [createPromotion(BigInt(1))];

            mockRepository.findActivePromotions.mockResolvedValue(promotions);
            mockRepository.getCurrencySettings.mockResolvedValue(createCurrencySettings(200)); // High minimum
            mockRepository.hasPreviousDeposits.mockResolvedValue(false);
            mockRepository.hasWithdrawn.mockResolvedValue(false);

            const result = await service.execute({
                userId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
            });

            expect(result).toHaveLength(0);
        });

        it('should filter out first deposit promotions when user has previous deposits', async () => {
            const promotions = [
                createPromotion(BigInt(1), {
                    targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
                }),
            ];

            mockRepository.findActivePromotions.mockResolvedValue(promotions);
            mockRepository.getCurrencySettings.mockResolvedValue(createCurrencySettings());
            mockRepository.hasPreviousDeposits.mockResolvedValue(true); // Has previous deposits
            mockRepository.hasWithdrawn.mockResolvedValue(false);

            const result = await service.execute({
                userId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
            });

            expect(result).toHaveLength(0);
        });

        it('should filter out until-first-withdrawal promotions when user has withdrawn', async () => {
            const promotions = [
                createPromotion(BigInt(1), {
                    qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
                }),
            ];

            mockRepository.findActivePromotions.mockResolvedValue(promotions);
            mockRepository.getCurrencySettings.mockResolvedValue(createCurrencySettings());
            mockRepository.hasPreviousDeposits.mockResolvedValue(false);
            mockRepository.hasWithdrawn.mockResolvedValue(true); // Has withdrawn

            const result = await service.execute({
                userId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
            });

            expect(result).toHaveLength(0);
        });

        it('should filter out one-time promotions already used', async () => {
            const promotions = [
                createPromotion(BigInt(1), { isOneTime: true }),
            ];

            const usedUserPromotion = UserPromotion.fromPersistence({
                id: 1,
                userId,
                promotionId: 1,
                status: UserPromotionStatus.COMPLETED,
                depositAmount: new Prisma.Decimal(100),
                bonusAmount: new Prisma.Decimal(10), // Bonus granted
                targetRollingAmount: new Prisma.Decimal(50),
                currentRollingAmount: new Prisma.Decimal(50),
                currency: ExchangeCurrencyCode.USDT,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockRepository.findActivePromotions.mockResolvedValue(promotions);
            mockRepository.getCurrencySettings.mockResolvedValue(createCurrencySettings());
            mockRepository.hasPreviousDeposits.mockResolvedValue(false);
            mockRepository.hasWithdrawn.mockResolvedValue(false);
            mockRepository.findUserPromotion.mockResolvedValue(usedUserPromotion);

            const result = await service.execute({
                userId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
            });

            expect(result).toHaveLength(0);
        });

        it('should return empty array when no active promotions', async () => {
            mockRepository.findActivePromotions.mockResolvedValue([]);
            mockRepository.hasPreviousDeposits.mockResolvedValue(false);
            mockRepository.hasWithdrawn.mockResolvedValue(false);

            const result = await service.execute({
                userId,
                depositAmount: new Prisma.Decimal(100),
                currency: ExchangeCurrencyCode.USDT,
            });

            expect(result).toHaveLength(0);
        });
    });
});
