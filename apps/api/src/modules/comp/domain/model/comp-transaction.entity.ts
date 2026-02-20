import type { CompTransactionType, Prisma } from '@prisma/client';

export class CompTransaction {
  private constructor(
    public readonly id: bigint,
    public readonly compWalletId: bigint,
    public readonly amount: Prisma.Decimal,
    public readonly balanceBefore: Prisma.Decimal, // [추가]
    public readonly balanceAfter: Prisma.Decimal,
    public readonly appliedRate: Prisma.Decimal | null, // [추가]
    public readonly type: CompTransactionType,
    public readonly referenceId: bigint | null,
    public readonly processedBy: bigint | null, // [추가] 관리자 ID 등
    public readonly description: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    id: bigint; // Snowflake ID inject
    compWalletId: bigint;
    amount: Prisma.Decimal;
    balanceBefore: Prisma.Decimal;
    balanceAfter: Prisma.Decimal;
    appliedRate?: Prisma.Decimal | null;
    type: CompTransactionType;
    referenceId?: bigint;
    processedBy?: bigint;
    description?: string;
  }): CompTransaction {
    return new CompTransaction(
      params.id,
      params.compWalletId,
      params.amount,
      params.balanceBefore,
      params.balanceAfter,
      params.appliedRate ?? null,
      params.type,
      params.referenceId ?? null,
      params.processedBy ?? null,
      params.description ?? null,
      new Date(),
    );
  }

  /**
   * Rehydrate a CompTransaction from persistence layer.
   * Used by repository/mapper only.
   */
  static rehydrate(params: {
    id: bigint;
    compWalletId: bigint;
    amount: Prisma.Decimal;
    balanceBefore: Prisma.Decimal;
    balanceAfter: Prisma.Decimal;
    appliedRate: Prisma.Decimal | null;
    type: CompTransactionType;
    referenceId: bigint | null;
    processedBy: bigint | null;
    description: string | null;
    createdAt: Date;
  }): CompTransaction {
    return new CompTransaction(
      params.id,
      params.compWalletId,
      params.amount,
      params.balanceBefore,
      params.balanceAfter,
      params.appliedRate,
      params.type,
      params.referenceId,
      params.processedBy,
      params.description,
      params.createdAt,
    );
  }
}
