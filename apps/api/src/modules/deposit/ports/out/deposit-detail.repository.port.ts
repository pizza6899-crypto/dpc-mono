// apps/api/src/modules/deposit/ports/out/deposit-detail.repository.port.ts
import { Prisma, TransactionStatus, TransactionType, ExchangeCurrencyCode } from '@repo/database';
import { DepositDetail } from '../../domain';

export interface DepositDetailRepositoryPort {
  findById(id: bigint, include?: { transaction?: boolean; bankDepositConfig?: boolean; cryptoDepositConfig?: boolean }): Promise<DepositDetail | null>;
  getById(id: bigint, include?: { transaction?: boolean; bankDepositConfig?: boolean; cryptoDepositConfig?: boolean }): Promise<DepositDetail>;
  update(deposit: DepositDetail): Promise<DepositDetail>;
  create(deposit: DepositDetail): Promise<DepositDetail>;
  createTransaction(data: {
    userId: bigint;
    type: TransactionType;
    status: TransactionStatus;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    beforeAmount: Prisma.Decimal;
    afterAmount: Prisma.Decimal;
  }): Promise<bigint>;
  getTransactionUserId(transactionId: bigint): Promise<bigint | null>;
  listByUserId(userId: bigint, query: any): Promise<{ items: DepositDetail[]; total: number }>;
  findByUidAndUserId(uid: string, userId: bigint): Promise<DepositDetail | null>;
  existsPendingByUserId(userId: bigint): Promise<boolean>;
  acquireUserLock(userId: bigint): Promise<void>;
  acquireDepositLock(depositId: bigint): Promise<void>;
}

