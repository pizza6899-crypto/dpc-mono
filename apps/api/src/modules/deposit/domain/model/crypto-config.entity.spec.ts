// src/modules/deposit/domain/model/crypto-config.entity.spec.ts
import { Prisma } from '@prisma/client';
import { CryptoConfig } from './crypto-config.entity';

describe('CryptoConfig Entity', () => {
    const defaultParams = {
        uid: 'crypto-uid-123',
        symbol: 'USDT',
        network: 'TRC20',
        minDepositAmount: new Prisma.Decimal('10'),
        depositFeeRate: new Prisma.Decimal('0.01'),
        confirmations: 12,
    };

    describe('create', () => {
        it('should create a new crypto config with required fields', () => {
            const config = CryptoConfig.create(defaultParams);

            expect(config.id).toBeNull();
            expect(config.uid).toBe('crypto-uid-123');
            expect(config.symbol).toBe('USDT');
            expect(config.network).toBe('TRC20');
            expect(config.isActive).toBe(true);
            expect(config.minDepositAmount).toEqual(new Prisma.Decimal('10'));
            expect(config.depositFeeRate).toEqual(new Prisma.Decimal('0.01'));
            expect(config.confirmations).toBe(12);
            expect(config.contractAddress).toBeNull();
            expect(config.createdAt).toBeInstanceOf(Date);
            expect(config.updatedAt).toBeInstanceOf(Date);
        });

        it('should create with optional fields', () => {
            const config = CryptoConfig.create({
                ...defaultParams,
                isActive: false,
                contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            });

            expect(config.isActive).toBe(false);
            expect(config.contractAddress).toBe('0xdac17f958d2ee523a2206206994597c13d831ec7');
        });
    });

    describe('fromPersistence', () => {
        it('should create entity from persistence data', () => {
            const now = new Date();
            const config = CryptoConfig.fromPersistence({
                id: BigInt(1),
                uid: 'crypto-uid-123',
                symbol: 'USDT',
                network: 'TRC20',
                isActive: true,
                minDepositAmount: new Prisma.Decimal('10'),
                depositFeeRate: new Prisma.Decimal('0.01'),
                confirmations: 12,
                contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                createdAt: now,
                updatedAt: now,
            });

            expect(config.id).toBe(BigInt(1));
            expect(config.uid).toBe('crypto-uid-123');
            expect(config.symbol).toBe('USDT');
            expect(config.contractAddress).toBe('0xdac17f958d2ee523a2206206994597c13d831ec7');
        });
    });

    describe('update', () => {
        it('should return a new instance with updated fields (immutable)', () => {
            const original = CryptoConfig.create(defaultParams);

            const updated = original.update({
                symbol: 'ETH',
                network: 'ERC20',
                confirmations: 20,
            });

            // 원본은 변경되지 않음
            expect(original.symbol).toBe('USDT');
            expect(original.network).toBe('TRC20');
            expect(original.confirmations).toBe(12);

            // 새 인스턴스는 변경됨
            expect(updated.symbol).toBe('ETH');
            expect(updated.network).toBe('ERC20');
            expect(updated.confirmations).toBe(20);

            // 다른 필드는 유지
            expect(updated.uid).toBe('crypto-uid-123');
            expect(updated.depositFeeRate).toEqual(new Prisma.Decimal('0.01'));
        });

        it('should update contractAddress to null', () => {
            const original = CryptoConfig.create({
                ...defaultParams,
                contractAddress: '0x123',
            });

            const updated = original.update({ contractAddress: null });

            expect(original.contractAddress).toBe('0x123');
            expect(updated.contractAddress).toBeNull();
        });

        it('should update isActive', () => {
            const original = CryptoConfig.create(defaultParams);
            expect(original.isActive).toBe(true);

            const updated = original.update({ isActive: false });
            expect(updated.isActive).toBe(false);
        });
    });

    describe('toggleActive / activate / deactivate (immutable)', () => {
        it('should toggle active state and return new instance', () => {
            const config = CryptoConfig.create(defaultParams);
            expect(config.isActive).toBe(true);

            const toggled = config.toggleActive();
            expect(config.isActive).toBe(true); // 원본 불변
            expect(toggled.isActive).toBe(false);

            const toggledAgain = toggled.toggleActive();
            expect(toggledAgain.isActive).toBe(true);
        });

        it('should activate and return new instance', () => {
            const config = CryptoConfig.create({ ...defaultParams, isActive: false });
            expect(config.isActive).toBe(false);

            const activated = config.activate();
            expect(config.isActive).toBe(false); // 원본 불변
            expect(activated.isActive).toBe(true);
        });

        it('should deactivate and return new instance', () => {
            const config = CryptoConfig.create(defaultParams);
            expect(config.isActive).toBe(true);

            const deactivated = config.deactivate();
            expect(config.isActive).toBe(true); // 원본 불변
            expect(deactivated.isActive).toBe(false);
        });
    });

    describe('isAmountAboveMinimum', () => {
        it('should return true when amount >= minDepositAmount', () => {
            const config = CryptoConfig.create(defaultParams);

            expect(config.isAmountAboveMinimum(new Prisma.Decimal('10'))).toBe(true);
            expect(config.isAmountAboveMinimum(new Prisma.Decimal('100'))).toBe(true);
            expect(config.isAmountAboveMinimum(new Prisma.Decimal('9.99'))).toBe(false);
        });
    });

    describe('calculateFee', () => {
        it('should calculate fee based on depositFeeRate', () => {
            const config = CryptoConfig.create(defaultParams);

            const fee = config.calculateFee(new Prisma.Decimal('100'));
            expect(fee).toEqual(new Prisma.Decimal('1')); // 100 * 0.01 = 1
        });

        it('should calculate fee for larger amounts', () => {
            const config = CryptoConfig.create({
                ...defaultParams,
                depositFeeRate: new Prisma.Decimal('0.005'), // 0.5%
            });

            const fee = config.calculateFee(new Prisma.Decimal('1000'));
            expect(fee).toEqual(new Prisma.Decimal('5')); // 1000 * 0.005 = 5
        });
    });

    describe('calculateAmountAfterFee', () => {
        it('should calculate amount after fee deduction', () => {
            const config = CryptoConfig.create(defaultParams);

            const amountAfterFee = config.calculateAmountAfterFee(new Prisma.Decimal('100'));
            expect(amountAfterFee).toEqual(new Prisma.Decimal('99')); // 100 - (100 * 0.01)
        });
    });

    describe('isToken / isNativeCoin', () => {
        it('should return isToken true when contractAddress exists', () => {
            const config = CryptoConfig.create({
                ...defaultParams,
                contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            });

            expect(config.isToken()).toBe(true);
            expect(config.isNativeCoin()).toBe(false);
        });

        it('should return isNativeCoin true when no contractAddress', () => {
            const config = CryptoConfig.create(defaultParams);

            expect(config.isNativeCoin()).toBe(true);
            expect(config.isToken()).toBe(false);
        });

        it('should return isNativeCoin true for empty string contractAddress', () => {
            const config = CryptoConfig.create({
                ...defaultParams,
                contractAddress: '',
            });

            expect(config.isNativeCoin()).toBe(true);
            expect(config.isToken()).toBe(false);
        });
    });

    describe('getUniqueKey', () => {
        it('should return symbol_network combination', () => {
            const config = CryptoConfig.create(defaultParams);

            expect(config.getUniqueKey()).toBe('USDT_TRC20');
        });

        it('should return different key for different network', () => {
            const trc20 = CryptoConfig.create(defaultParams);
            const erc20 = CryptoConfig.create({ ...defaultParams, network: 'ERC20' });

            expect(trc20.getUniqueKey()).toBe('USDT_TRC20');
            expect(erc20.getUniqueKey()).toBe('USDT_ERC20');
        });
    });

    describe('toPersistence', () => {
        it('should convert entity to persistence format', () => {
            const config = CryptoConfig.create(defaultParams);
            const persistence = config.toPersistence();

            expect(persistence.id).toBeNull();
            expect(persistence.uid).toBe('crypto-uid-123');
            expect(persistence.symbol).toBe('USDT');
            expect(persistence.network).toBe('TRC20');
            expect(persistence.isActive).toBe(true);
            expect(persistence.minDepositAmount).toEqual(new Prisma.Decimal('10'));
            expect(persistence.depositFeeRate).toEqual(new Prisma.Decimal('0.01'));
            expect(persistence.confirmations).toBe(12);
            expect(persistence.contractAddress).toBeNull();
        });
    });
});
