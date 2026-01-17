// src/modules/wagering/application/create-wagering-requirement.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma, ExchangeCurrencyCode, WageringSourceType, WageringStatus } from 'src/generated/prisma';
import { CreateWageringRequirementService } from './create-wagering-requirement.service';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringRequirement } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('CreateWageringRequirementService', () => {
    let module: TestingModule;
    let service: CreateWageringRequirementService;
    let mockRepository: jest.Mocked<WageringRequirementRepositoryPort>;
    let mockDispatchLogService: jest.Mocked<DispatchLogService>;

    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;
    const sourceType = 'DEPOSIT' as WageringSourceType;

    const createWageringRequirement = () => {
        return WageringRequirement.rehydrate({
            id: BigInt(1),
            uid: 'wagering-uid-123',
            userId,
            currency,
            sourceType,
            requiredAmount: new Prisma.Decimal(100),
            currentAmount: new Prisma.Decimal(0),
            cancellationBalanceThreshold: null,
            status: 'ACTIVE' as WageringStatus,
            priority: 0,
            depositDetailId: BigInt(5),
            userPromotionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: null,
            completedAt: null,
            cancelledAt: null,
            cancellationNote: null,
        });
    };

    beforeEach(async () => {
        mockRepository = {
            create: jest.fn(),
            findActiveByUserIdAndCurrency: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findByUid: jest.fn(),
            getByUid: jest.fn(),
            findByUserId: jest.fn(),
            findPaginated: jest.fn(),
        };

        mockDispatchLogService = {
            dispatch: jest.fn().mockResolvedValue(undefined),
        } as any;

        module = await Test.createTestingModule({
            imports: [PrismaModule, EnvModule],
            providers: [
                CreateWageringRequirementService,
                { provide: WAGERING_REQUIREMENT_REPOSITORY, useValue: mockRepository },
                { provide: DispatchLogService, useValue: mockDispatchLogService },
            ],
        }).compile();

        service = module.get<CreateWageringRequirementService>(CreateWageringRequirementService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should create wagering requirement successfully', async () => {
            const createdRequirement = createWageringRequirement();
            mockRepository.create.mockResolvedValue(createdRequirement);

            const result = await service.execute({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                depositDetailId: BigInt(5),
            });

            expect(result).toBe(createdRequirement);
            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'CREATE_WAGERING_REQUIREMENT',
                    }),
                }),
                undefined,
            );
        });

        it('should create with all optional parameters', async () => {
            const createdRequirement = createWageringRequirement();
            mockRepository.create.mockResolvedValue(createdRequirement);

            await service.execute({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                priority: 10,
                depositDetailId: BigInt(5),
                userPromotionId: BigInt(3),
                expiresAt: new Date('2024-12-31'),
                cancellationBalanceThreshold: new Prisma.Decimal(0.1),
            });

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    props: expect.objectContaining({
                        priority: 10,
                    }),
                }),
            );
        });

        it('should dispatch audit log with correct metadata', async () => {
            const createdRequirement = createWageringRequirement();
            mockRepository.create.mockResolvedValue(createdRequirement);

            await service.execute({
                userId,
                currency,
                sourceType,
                requiredAmount: new Prisma.Decimal(100),
                depositDetailId: BigInt(5),
            });

            expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: userId.toString(),
                        category: 'WAGERING',
                        metadata: expect.objectContaining({
                            wageringId: '1',
                            sourceType,
                            requiredAmount: '100',
                        }),
                    }),
                }),
                undefined,
            );
        });
    });
});
