// src/modules/deposit/application/create-crypto-config.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { CreateCryptoConfigService } from './create-crypto-config.service';
import { CRYPTO_CONFIG_REPOSITORY } from '../ports/out';
import { CryptoConfig } from '../domain';

describe('CreateCryptoConfigService', () => {
    let service: CreateCryptoConfigService;
    let mockRepository: jest.Mocked<any>;

    beforeEach(async () => {
        mockRepository = {
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateCryptoConfigService,
                {
                    provide: CRYPTO_CONFIG_REPOSITORY,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<CreateCryptoConfigService>(CreateCryptoConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('execute', () => {
        const createParams = {
            symbol: 'USDT',
            network: 'TRC20',
            isActive: true,
            minDepositAmount: '10',
            depositFeeRate: '0.01',
            confirmations: 12,
            contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        };

        it('should create a new crypto config successfully', async () => {
            const expectedConfig = CryptoConfig.create({
                uid: 'generated-uid',
                symbol: createParams.symbol,
                network: createParams.network,
                isActive: createParams.isActive,
                minDepositAmount: new Prisma.Decimal(createParams.minDepositAmount),
                depositFeeRate: new Prisma.Decimal(createParams.depositFeeRate),
                confirmations: createParams.confirmations,
                contractAddress: createParams.contractAddress,
            });

            mockRepository.create.mockResolvedValue(expectedConfig);

            const result = await service.execute(createParams);

            expect(mockRepository.create).toHaveBeenCalledTimes(1);
            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    symbol: createParams.symbol,
                    network: createParams.network,
                }),
            );
            expect(result.symbol).toBe(createParams.symbol);
            expect(result.network).toBe(createParams.network);
        });

        it('should create crypto config without contractAddress (native coin)', async () => {
            const paramsWithoutContract = {
                ...createParams,
                contractAddress: undefined,
            };

            const expectedConfig = CryptoConfig.create({
                uid: 'generated-uid',
                symbol: paramsWithoutContract.symbol,
                network: paramsWithoutContract.network,
                minDepositAmount: new Prisma.Decimal(paramsWithoutContract.minDepositAmount),
                depositFeeRate: new Prisma.Decimal(paramsWithoutContract.depositFeeRate),
                confirmations: paramsWithoutContract.confirmations,
            });

            mockRepository.create.mockResolvedValue(expectedConfig);

            const result = await service.execute(paramsWithoutContract);

            expect(result.contractAddress).toBeNull();
            expect(result.isNativeCoin()).toBe(true);
        });
    });
});
