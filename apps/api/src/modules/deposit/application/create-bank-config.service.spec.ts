// src/modules/deposit/application/create-bank-config.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { CreateBankConfigService } from './create-bank-config.service';
import { BANK_CONFIG_REPOSITORY } from '../ports/out';
import { BankConfig } from '../domain';

describe('CreateBankConfigService', () => {
    let service: CreateBankConfigService;
    let mockRepository: jest.Mocked<any>;

    beforeEach(async () => {
        mockRepository = {
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateBankConfigService,
                {
                    provide: BANK_CONFIG_REPOSITORY,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<CreateBankConfigService>(CreateBankConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('execute', () => {
        const createParams = {
            currency: ExchangeCurrencyCode.KRW,
            bankName: 'KB국민은행',
            accountNumber: '123-456-7890',
            accountHolder: '홍길동',
            minAmount: '10000',
            maxAmount: '1000000',
            isActive: true,
            priority: 10,
            description: '주 계좌',
            notes: '운영 시간 09:00-18:00',
        };

        it('should create a new bank config successfully', async () => {
            const expectedConfig = BankConfig.create({
                uid: 'generated-uid',
                currency: createParams.currency,
                bankName: createParams.bankName,
                accountNumber: createParams.accountNumber,
                accountHolder: createParams.accountHolder,
                isActive: createParams.isActive,
                priority: createParams.priority,
                description: createParams.description,
                notes: createParams.notes,
                minAmount: new Prisma.Decimal(createParams.minAmount),
                maxAmount: new Prisma.Decimal(createParams.maxAmount),
            });

            mockRepository.create.mockResolvedValue(expectedConfig);

            const result = await service.execute(createParams);

            expect(mockRepository.create).toHaveBeenCalledTimes(1);
            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    currency: createParams.currency,
                    bankName: createParams.bankName,
                    accountNumber: createParams.accountNumber,
                    accountHolder: createParams.accountHolder,
                }),
            );
            expect(result.bankName).toBe(createParams.bankName);
            expect(result.currency).toBe(createParams.currency);
        });

        it('should create bank config without maxAmount', async () => {
            const paramsWithoutMax = {
                ...createParams,
                maxAmount: undefined,
            };

            const expectedConfig = BankConfig.create({
                uid: 'generated-uid',
                currency: paramsWithoutMax.currency,
                bankName: paramsWithoutMax.bankName,
                accountNumber: paramsWithoutMax.accountNumber,
                accountHolder: paramsWithoutMax.accountHolder,
                minAmount: new Prisma.Decimal(paramsWithoutMax.minAmount),
                maxAmount: null,
            });

            mockRepository.create.mockResolvedValue(expectedConfig);

            const result = await service.execute(paramsWithoutMax);

            expect(result.maxAmount).toBeNull();
        });
    });
});
