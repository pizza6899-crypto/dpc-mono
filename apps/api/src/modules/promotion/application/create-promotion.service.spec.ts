// src/modules/promotion/application/create-promotion.service.spec.ts
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
    Language,
} from '@repo/database';
import { CreatePromotionService } from './create-promotion.service';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { Promotion } from '../domain';

describe('CreatePromotionService', () => {
    let module: TestingModule;
    let service: CreatePromotionService;
    let mockRepository: jest.Mocked<PromotionRepositoryPort>;

    const createdPromotion = Promotion.fromPersistence({
        id: BigInt(1),
        uid: 'promo-uid-123',
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
    });

    beforeEach(async () => {
        mockRepository = {
            create: jest.fn().mockResolvedValue(createdPromotion),
            upsertCurrencySettings: jest.fn().mockResolvedValue(undefined),
            createTranslations: jest.fn().mockResolvedValue([]),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                CreatePromotionService,
                { provide: PROMOTION_REPOSITORY, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<CreatePromotionService>(CreatePromotionService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should create promotion with basic fields', async () => {
            const result = await service.execute({
                managementName: 'Test Promotion',
                targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
                bonusType: PromotionBonusType.PERCENTAGE,
                qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
            });

            expect(result).toBe(createdPromotion);
            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    managementName: 'Test Promotion',
                    isActive: true, // default
                    isOneTime: false, // default
                }),
            );
        });

        it('should create currency settings when provided', async () => {
            await service.execute({
                managementName: 'Test Promotion',
                targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
                bonusType: PromotionBonusType.PERCENTAGE,
                qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
                currencies: [
                    {
                        currency: ExchangeCurrencyCode.USDT,
                        minDepositAmount: new Prisma.Decimal(10),
                        maxBonusAmount: new Prisma.Decimal(100),
                    },
                    {
                        currency: ExchangeCurrencyCode.KRW,
                        minDepositAmount: new Prisma.Decimal(10000),
                        maxBonusAmount: null,
                    },
                ],
            });

            expect(mockRepository.upsertCurrencySettings).toHaveBeenCalledTimes(2);
            expect(mockRepository.upsertCurrencySettings).toHaveBeenCalledWith(
                expect.objectContaining({
                    currency: ExchangeCurrencyCode.USDT,
                }),
            );
        });

        it('should create translations when provided', async () => {
            await service.execute({
                managementName: 'Test Promotion',
                targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
                bonusType: PromotionBonusType.PERCENTAGE,
                qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
                translations: [
                    {
                        language: Language.EN,
                        name: 'Welcome Bonus',
                        description: 'Get 10% bonus on your deposit',
                    },
                    {
                        language: Language.KO,
                        name: '웰컴 보너스',
                        description: '입금 시 10% 보너스',
                    },
                ],
            });

            expect(mockRepository.createTranslations).toHaveBeenCalledWith(
                BigInt(1),
                expect.arrayContaining([
                    expect.objectContaining({ language: Language.EN }),
                    expect.objectContaining({ language: Language.KO }),
                ]),
            );
        });

        it('should use provided optional values', async () => {
            await service.execute({
                managementName: 'Test',
                targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
                bonusType: PromotionBonusType.PERCENTAGE,
                qualificationMaintainCondition: PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
                isActive: false,
                isOneTime: true,
                bonusRate: new Prisma.Decimal(0.2),
                rollingMultiplier: new Prisma.Decimal(10),
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
            });

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: false,
                    isOneTime: true,
                    bonusRate: new Prisma.Decimal(0.2),
                    rollingMultiplier: new Prisma.Decimal(10),
                }),
            );
        });
    });
});
