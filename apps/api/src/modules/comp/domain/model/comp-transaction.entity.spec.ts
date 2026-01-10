// src/modules/comp/domain/model/comp-transaction.entity.spec.ts
import { Prisma, CompTransactionType } from '@repo/database';
import { CompTransaction } from './comp-transaction.entity';

describe('CompTransaction Entity', () => {
    const compWalletId = BigInt(1);

    describe('create', () => {
        it('should create a new comp transaction with required fields', () => {
            const transaction = CompTransaction.create({
                compWalletId,
                amount: new Prisma.Decimal(100),
                balanceAfter: new Prisma.Decimal(500),
                type: CompTransactionType.EARN,
            });

            expect(transaction.compWalletId).toBe(compWalletId);
            expect(transaction.amount).toEqual(new Prisma.Decimal(100));
            expect(transaction.balanceAfter).toEqual(new Prisma.Decimal(500));
            expect(transaction.type).toBe(CompTransactionType.EARN);
            expect(transaction.referenceId).toBeNull();
            expect(transaction.description).toBeNull();
            expect(transaction.createdAt).toBeInstanceOf(Date);
        });

        it('should create transaction with all optional fields', () => {
            const customDate = new Date('2024-06-15');
            const transaction = CompTransaction.create({
                id: BigInt(10),
                compWalletId,
                amount: new Prisma.Decimal(-50),
                balanceAfter: new Prisma.Decimal(450),
                type: CompTransactionType.CLAIM,
                referenceId: 'ref-123',
                description: 'Claimed for cash',
                createdAt: customDate,
            });

            expect(transaction.id).toBe(BigInt(10));
            expect(transaction.amount).toEqual(new Prisma.Decimal(-50));
            expect(transaction.type).toBe(CompTransactionType.CLAIM);
            expect(transaction.referenceId).toBe('ref-123');
            expect(transaction.description).toBe('Claimed for cash');
            expect(transaction.createdAt).toBe(customDate);
        });

        it('should default id to 0 when not provided', () => {
            const transaction = CompTransaction.create({
                compWalletId,
                amount: new Prisma.Decimal(10),
                balanceAfter: new Prisma.Decimal(10),
                type: CompTransactionType.EARN,
            });

            expect(transaction.id).toBe(BigInt(0));
        });

        it('should handle ADMIN transaction type', () => {
            const transaction = CompTransaction.create({
                compWalletId,
                amount: new Prisma.Decimal(-100),
                balanceAfter: new Prisma.Decimal(0),
                type: CompTransactionType.ADMIN,
                description: 'Admin deduction',
            });

            expect(transaction.type).toBe(CompTransactionType.ADMIN);
            expect(transaction.amount.isNegative()).toBe(true);
        });

        it('should handle negative amounts (for claims/deductions)', () => {
            const transaction = CompTransaction.create({
                compWalletId,
                amount: new Prisma.Decimal(-25.50),
                balanceAfter: new Prisma.Decimal(74.50),
                type: CompTransactionType.CLAIM,
            });

            expect(transaction.amount).toEqual(new Prisma.Decimal(-25.50));
        });
    });
});
