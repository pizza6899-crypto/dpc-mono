// src/modules/wagering/application/process-wagering-contribution.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma, ExchangeCurrencyCode, WageringSourceType, WageringStatus } from '@prisma/client';
import { ProcessWageringContributionService } from './process-wagering-contribution.service';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringRequirement, WageringPolicy } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('ProcessWageringContributionService', () => {
    let module: TestingModule;
    let service: ProcessWageringContributionService;
    let mockRepository: jest.Mocked<WageringRequirementRepositoryPort>;
    let mockDispatchLogService: jest.Mocked<DispatchLogService>;

    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;
    const gameRoundId = BigInt(1000);

    const createActiveRequirement = (id: bigint, required: number, current: number) => {
        return WageringRequirement.rehydrate({
            id,
            uid: `wagering-uid-${id}`,
            userId,
            currency,
            sourceType: 'DEPOSIT' as WageringSourceType,
            requiredAmount: new Prisma.Decimal(required),
            currentAmount: new Prisma.Decimal(current),
            cancellationBalanceThreshold: null,
            status: 'ACTIVE' as WageringStatus,
            priority: Number(id), // Higher ID = higher priority for test
            depositDetailId: null,
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
                ProcessWageringContributionService,
                WageringPolicy,
                { provide: WAGERING_REQUIREMENT_REPOSITORY, useValue: mockRepository },
                { provide: DispatchLogService, useValue: mockDispatchLogService },
            ],
        }).compile();

        service = module.get<ProcessWageringContributionService>(ProcessWageringContributionService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should do nothing when bet amount is 0 or negative', async () => {
            await service.execute({
                userId,
                currency,
                gameRoundId,
                betAmount: new Prisma.Decimal(0),
            });

            expect(mockRepository.findActiveByUserIdAndCurrency).not.toHaveBeenCalled();
        });

        it('should do nothing when no active requirements', async () => {
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([]);

            await service.execute({
                userId,
                currency,
                gameRoundId,
                betAmount: new Prisma.Decimal(100),
            });

            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should contribute to single requirement', async () => {
            const requirement = createActiveRequirement(BigInt(1), 100, 0);
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([requirement]);
            mockRepository.save.mockResolvedValue(requirement);

            await service.execute({
                userId,
                currency,
                gameRoundId,
                betAmount: new Prisma.Decimal(50),
            });

            expect(mockRepository.save).toHaveBeenCalledTimes(1);
            expect(requirement.currentAmount).toEqual(new Prisma.Decimal(50));
        });

        it('should apply game contribution rate', async () => {
            const requirement = createActiveRequirement(BigInt(1), 100, 0);
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([requirement]);
            mockRepository.save.mockResolvedValue(requirement);

            await service.execute({
                userId,
                currency,
                gameRoundId,
                betAmount: new Prisma.Decimal(100),
                gameContributionRate: 0.5, // 50%
            });

            expect(requirement.currentAmount).toEqual(new Prisma.Decimal(50));
        });

        it('should distribute contribution across multiple requirements', async () => {
            const req1 = createActiveRequirement(BigInt(1), 30, 0); // First: needs 30
            const req2 = createActiveRequirement(BigInt(2), 50, 0); // Second: needs 50
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([req1, req2]);
            mockRepository.save.mockImplementation(async (req) => req);

            await service.execute({
                userId,
                currency,
                gameRoundId,
                betAmount: new Prisma.Decimal(60), // Contribute 60 total
            });

            expect(req1.currentAmount).toEqual(new Prisma.Decimal(30)); // Filled
            expect(req1.isCompleted).toBe(true);
            expect(req2.currentAmount).toEqual(new Prisma.Decimal(30)); // Remaining 30
            expect(req2.isCompleted).toBe(false);
        });

        it('should dispatch completion log when requirement completes', async () => {
            const requirement = createActiveRequirement(BigInt(1), 50, 40); // Needs only 10 more
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([requirement]);
            mockRepository.save.mockResolvedValue(requirement);

            await service.execute({
                userId,
                currency,
                gameRoundId,
                betAmount: new Prisma.Decimal(20),
            });

            expect(requirement.isCompleted).toBe(true);
            expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'COMPLETE_WAGERING_REQUIREMENT',
                    }),
                }),
            );
        });
    });
});
