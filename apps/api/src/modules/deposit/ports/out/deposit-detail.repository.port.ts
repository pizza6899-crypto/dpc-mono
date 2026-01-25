// apps/api/src/modules/deposit/ports/out/deposit-detail.repository.port.ts
import { Prisma, ExchangeCurrencyCode, DepositDetailStatus, DepositMethodType } from '@prisma/client';
import { DepositDetail } from '../../domain';

export interface DepositListQuery {
  skip?: number;
  take?: number;
  status?: DepositDetailStatus;
  methodType?: DepositMethodType;
  userId?: bigint;
  currency?: ExchangeCurrencyCode;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DepositStats {
  todayTotalAmount: Prisma.Decimal;
  pendingCount: number;
  methodDistribution: {
    crypto: number;
    bank: number;
  };
}

export interface DepositWithUser {
  deposit: DepositDetail;
  userEmail: string | null;
}

export interface DepositDetailRepositoryPort {
  findById(id: bigint, include?: { bankDepositConfig?: boolean; cryptoDepositConfig?: boolean }): Promise<DepositDetail | null>;
  getById(id: bigint, include?: { bankDepositConfig?: boolean; cryptoDepositConfig?: boolean }): Promise<DepositDetail>;
  update(deposit: DepositDetail): Promise<DepositDetail>;
  create(deposit: DepositDetail): Promise<DepositDetail>;
  createTransaction(data: {
    userId: bigint;
    type: any; // TransactionType 삭제됨
    status: any; // TransactionStatus 삭제됨
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    beforeAmount: Prisma.Decimal;
    afterAmount: Prisma.Decimal;
  }): Promise<bigint>;
  getTransactionUserId(transactionId: bigint): Promise<bigint | null>;

  // User queries
  listByUserId(userId: bigint, query: DepositListQuery): Promise<{ items: DepositDetail[]; total: number }>;
  findByUidAndUserId(uid: string, userId: bigint): Promise<DepositDetail | null>;
  findByIdAndUserId(id: bigint, userId: bigint): Promise<DepositDetail | null>;
  existsPendingByUserId(userId: bigint): Promise<boolean>;

  // Admin queries
  list(query: DepositListQuery): Promise<{ items: DepositWithUser[]; total: number }>;
  getByIdWithUser(id: bigint): Promise<DepositWithUser>;
  getStats(): Promise<DepositStats>;
}

