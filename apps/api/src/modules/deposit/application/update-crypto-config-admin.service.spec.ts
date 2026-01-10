// src/modules/deposit/application/update-crypto-config-admin.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@repo/database';
import { UpdateCryptoConfigAdminService } from './update-crypto-config-admin.service';
import { CRYPTO_CONFIG_REPOSITORY } from '../ports/out';
import { CryptoConfig } from '../domain';

describe('UpdateCryptoConfigAdminService', () => {
    let service: UpdateCryptoConfigAdminService;
    let mockRepository: jest.Mocked<any>;

    const existingConfig = CryptoConfig.fromPersistence({
        id: BigInt(1),
        uid: 'crypto-uid-123',
        symbol: 'USDT',
        network: 'TRC20',
        isActive: true,
        minDepositAmount: new Prisma.Decimal('10'),
        depositFeeRate: new Prisma.Decimal('0.01'),
        confirmations: 12,
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    beforeEach(async () => {
        mockRepository = {
            getById: jest.fn(),
            update: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateCryptoConfigAdminService,
                {
                    provide: CRYPTO_CONFIG_REPOSITORY,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UpdateCryptoConfigAdminService>(UpdateCryptoConfigAdminService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('execute', () => {
        it('should update crypto config successfully', async () => {
            mockRepository.getById.mockResolvedValue(existingConfig);
            mockRepository.update.mockImplementation((config) => Promise.resolve(config));

            const result = await service.execute({
                id: BigInt(1),
                confirmations: 20,
                minDepositAmount: '50',
            });

            expect(mockRepository.getById).toHaveBeenCalledWith(BigInt(1));
            expect(mockRepository.update).toHaveBeenCalledTimes(1);
            expect(result.confirmations).toBe(20);
            expect(result.minDepositAmount).toEqual(new Prisma.Decimal('50'));
            // 다른 필드는 유지
            expect(result.symbol).toBe('USDT');
            expect(result.network).toBe('TRC20');
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

        it('should update depositFeeRate', async () => {
            mockRepository.getById.mockResolvedValue(existingConfig);
            mockRepository.update.mockImplementation((config) => Promise.resolve(config));

            const result = await service.execute({
                id: BigInt(1),
                depositFeeRate: '0.02',
            });

            expect(result.depositFeeRate).toEqual(new Prisma.Decimal('0.02'));
        });

        it('should update symbol and network', async () => {
            mockRepository.getById.mockResolvedValue(existingConfig);
            mockRepository.update.mockImplementation((config) => Promise.resolve(config));

            const result = await service.execute({
                id: BigInt(1),
                symbol: 'ETH',
                network: 'ERC20',
            });

            expect(result.symbol).toBe('ETH');
            expect(result.network).toBe('ERC20');
        });
    });
});
