// src/modules/wagering/application/cancel-wagering-requirement.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Prisma, ExchangeCurrencyCode, WageringSourceType, WageringStatus } from 'src/generated/prisma';
import { CancelWageringRequirementService } from './cancel-wagering-requirement.service';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { WageringRequirement, WageringPolicy } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('CancelWageringRequirementService', () => {
    let module: TestingModule;
    let service: CancelWageringRequirementService;
    let mockRepository: jest.Mocked<WageringRequirementRepositoryPort>;
    let mockDispatchLogService: jest.Mocked<DispatchLogService>;

    const userId = BigInt(100);
    const currency = ExchangeCurrencyCode.USDT;

    const createActiveRequirement = (threshold: Prisma.Decimal | null) => {
        return WageringRequirement.rehydrate({
            id: BigInt(1),
            uid: 'wagering-uid-123',
            userId,
            currency,
            sourceType: 'DEPOSIT' as WageringSourceType,
            requiredAmount: new Prisma.Decimal(100),
            currentAmount: new Prisma.Decimal(50),
            cancellationBalanceThreshold: threshold,
            status: 'ACTIVE' as WageringStatus,
            priority: 0,
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
                CancelWageringRequirementService,
                WageringPolicy,
                { provide: WAGERING_REQUIREMENT_REPOSITORY, useValue: mockRepository },
                { provide: DispatchLogService, useValue: mockDispatchLogService },
            ],
        }).compile();

        service = module.get<CancelWageringRequirementService>(CancelWageringRequirementService);
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('execute', () => {
        it('should do nothing when no active requirements', async () => {
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([]);

            await service.execute(userId, currency, new Prisma.Decimal(0));

            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should cancel requirement when balance below threshold', async () => {
            const requirement = createActiveRequirement(new Prisma.Decimal(1)); // Threshold: 1
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([requirement]);
            mockRepository.save.mockResolvedValue(requirement);

            await service.execute(userId, currency, new Prisma.Decimal(0.5)); // Balance: 0.5 < 1

            expect(requirement.status).toBe('CANCELLED');
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'CANCEL_WAGERING_REQUIREMENT',
                        metadata: expect.objectContaining({
                            reason: 'O_RING',
                        }),
                    }),
                }),
            );
        });

        it('should not cancel when balance equals or exceeds threshold', async () => {
            const requirement = createActiveRequirement(new Prisma.Decimal(1));
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([requirement]);

            await service.execute(userId, currency, new Prisma.Decimal(1)); // Balance equals threshold

            expect(requirement.status).toBe('ACTIVE');
            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should not cancel when threshold is null', async () => {
            const requirement = createActiveRequirement(null);
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([requirement]);

            await service.execute(userId, currency, new Prisma.Decimal(0)); // Balance is 0

            expect(requirement.status).toBe('ACTIVE');
            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should include cancellation note with balance info', async () => {
            const requirement = createActiveRequirement(new Prisma.Decimal(0.1));
            mockRepository.findActiveByUserIdAndCurrency.mockResolvedValue([requirement]);
            mockRepository.save.mockResolvedValue(requirement);

            await service.execute(userId, currency, new Prisma.Decimal(0.05));

            expect(requirement.cancellationNote).toContain('Insufficient balance');
            expect(requirement.cancellationNote).toContain('0.05');
            expect(requirement.cancellationNote).toContain('0.1');
        });
    });
});
