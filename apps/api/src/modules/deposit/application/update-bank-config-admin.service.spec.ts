// src/modules/deposit/application/update-bank-config-admin.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { UpdateBankConfigAdminService } from './update-bank-config-admin.service';
import { BANK_CONFIG_REPOSITORY } from '../ports/out';
import { BankConfig } from '../domain';

describe('UpdateBankConfigAdminService', () => {
    let service: UpdateBankConfigAdminService;
    let mockRepository: jest.Mocked<any>;

    const existingConfig = BankConfig.fromPersistence({
        id: BigInt(1),
        uid: 'bank-uid-123',
        currency: ExchangeCurrencyCode.KRW,
        bankName: 'KB국민은행',
        accountNumber: '123-456-7890',
        accountHolder: '홍길동',
        isActive: true,
        priority: 0,
        description: null,
        notes: null,
        minAmount: new Prisma.Decimal('10000'),
        maxAmount: null,
        totalDeposits: 50,
        totalDepositAmount: new Prisma.Decimal('2500000'),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    });

    beforeEach(async () => {
        mockRepository = {
            getById: jest.fn(),
            update: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateBankConfigAdminService,
                {
                    provide: BANK_CONFIG_REPOSITORY,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UpdateBankConfigAdminService>(UpdateBankConfigAdminService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('execute', () => {
        it('should update bank config successfully', async () => {
            mockRepository.getById.mockResolvedValue(existingConfig);
            mockRepository.update.mockImplementation((config) => Promise.resolve(config));

            const result = await service.execute({
                id: BigInt(1),
                bankName: '신한은행',
                priority: 10,
            });

            expect(mockRepository.getById).toHaveBeenCalledWith(BigInt(1));
            expect(mockRepository.update).toHaveBeenCalledTimes(1);
            expect(result.bankName).toBe('신한은행');
            expect(result.priority).toBe(10);
            // 다른 필드는 유지
            expect(result.accountNumber).toBe('123-456-7890');
        });

        it('should update isActive status', async () => {
            mockRepository.getById.mockResolvedValue(existingConfig);
            mockRepository.update.mockImplementation((config) => Promise.resolve(config));

            const result = await service.execute({
                id: BigInt(1),
                isActive: false,
            });

            expect(result.isActive).toBe(false);
        });

        it('should update minAmount and maxAmount', async () => {
            mockRepository.getById.mockResolvedValue(existingConfig);
            mockRepository.update.mockImplementation((config) => Promise.resolve(config));

            const result = await service.execute({
                id: BigInt(1),
                minAmount: '50000',
                maxAmount: '5000000',
            });

            expect(result.minAmount).toEqual(new Prisma.Decimal('50000'));
            expect(result.maxAmount).toEqual(new Prisma.Decimal('5000000'));
        });
    });
});
