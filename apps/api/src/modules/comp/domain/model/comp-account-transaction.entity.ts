import type { CompTransactionType, Prisma } from '@prisma/client';

export class CompAccountTransaction {
  private constructor(
    public readonly id: bigint,
    public readonly compAccountId: bigint,
    public readonly amount: Prisma.Decimal,
    public readonly appliedRate: Prisma.Decimal | null,
    public readonly type: CompTransactionType,
    public readonly referenceId: bigint | null,
    public readonly processedBy: bigint | null,
    public readonly parentTransactionId: bigint | null,
    public readonly metadata: any | null,
    public readonly description: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    id: bigint; // Snowflake ID inject
    compAccountId: bigint;
    amount: Prisma.Decimal;
    appliedRate?: Prisma.Decimal | null;
    type: CompTransactionType;
    referenceId?: bigint;
    processedBy?: bigint;
    parentTransactionId?: bigint;
    metadata?: any;
    description?: string;
    createdAt: Date;
  }): CompAccountTransaction {
    return new CompAccountTransaction(
      params.id,
      params.compAccountId,
      params.amount,
      params.appliedRate ?? null,
      params.type,
      params.referenceId ?? null,
      params.processedBy ?? null,
      params.parentTransactionId ?? null,
      params.metadata ?? null,
      params.description ?? null,
      params.createdAt,
    );
  }

  /**
   * Rehydrate from persistence layer.
   * Used by repository/mapper only.
   */
  static rehydrate(params: {
    id: bigint;
    compAccountId: bigint;
    amount: Prisma.Decimal;
    appliedRate: Prisma.Decimal | null;
    type: CompTransactionType;
    referenceId: bigint | null;
    processedBy: bigint | null;
    parentTransactionId: bigint | null;
    metadata: any | null;
    description: string | null;
    createdAt: Date;
  }): CompAccountTransaction {
    return new CompAccountTransaction(
      params.id,
      params.compAccountId,
      params.amount,
      params.appliedRate,
      params.type,
      params.referenceId,
      params.processedBy,
      params.parentTransactionId,
      params.metadata,
      params.description,
      params.createdAt,
    );
  }
}
